import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ResourceItem } from '@/types';
import { useAuth } from './useAuth';
import { uploadStudyFile } from '@/lib/storageHelpers';
import { generateUUID } from '@/lib/utils';

export function useResources() {
  const { user, block } = useAuth();
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [ratings, setRatings] = useState<Record<string, { avg: number; count: number; userScore: number | null }>>({});

  const loadResources = useCallback(async () => {
    if (!block?.id) {
      setResources([]);
      return;
    }
    try {
      if (isSupabaseConfigured) {
        const { data: resData } = await supabase.from('resources').select('*').eq('block_id', block.id).order('created_at', { ascending: false });
        if (resData) setResources(resData as ResourceItem[]);

        const { data: ratData } = await supabase.from('resource_ratings').select('*');
        if (ratData) {
          const ratingMap: Record<string, { total: number; count: number; userScore: number | null }> = {};
          for (const r of ratData) {
            if (!ratingMap[r.resource_id]) ratingMap[r.resource_id] = { total: 0, count: 0, userScore: null };
            ratingMap[r.resource_id].total += r.rating;
            ratingMap[r.resource_id].count += 1;
            if (user && r.user_id === user.id) ratingMap[r.resource_id].userScore = r.rating;
          }
          const computed: Record<string, { avg: number; count: number; userScore: number | null }> = {};
          for (const [id, stats] of Object.entries(ratingMap)) {
            computed[id] = { avg: stats.count > 0 ? stats.total / stats.count : 0, count: stats.count, userScore: stats.userScore };
          }
          setRatings(computed);
        }
      }
    } catch (err) {
      console.warn('Could not load Supabase resources:', err);
    }
  }, [block?.id, user?.id]);

  useEffect(() => {
    loadResources();
    if (!isSupabaseConfigured || !block?.id) return;

    const channel = supabase.channel(`realtime_resources_${block.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, () => loadResources())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resource_ratings' }, () => loadResources())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadResources, block?.id]);

  const enrichedResources = useMemo(() => {
    return resources.map((r) => ({
      ...r,
      avg_rating: ratings[r.id]?.avg ?? r.avg_rating ?? 0,
      ratings_count: ratings[r.id]?.count ?? r.ratings_count ?? 0,
      user_rating: ratings[r.id]?.userScore ?? r.user_rating ?? null,
    }));
  }, [resources, ratings]);

  const rateResource = async (resourceId: string, rating: number) => {
    if (!user) return;
    setRatings((prev) => {
      const existing = prev[resourceId] || { avg: rating, count: 0, userScore: null };
      return { ...prev, [resourceId]: { avg: rating, count: existing.userScore ? existing.count : existing.count + 1, userScore: rating } };
    });
    if (isSupabaseConfigured) {
      await supabase.from('resource_ratings').upsert({ resource_id: resourceId, user_id: user.id, rating }, { onConflict: 'resource_id,user_id' });
    }
  };

  const uploadFile = async (file: File, title: string, assignmentId?: string | null) => {
    if (!user || !block) return;
    const { fileUrl, filePath } = await uploadStudyFile(file, block.id);
    const resId = generateUUID();
    const validAsgId = assignmentId && !assignmentId.startsWith('asg_sample') ? assignmentId : null;

    const newRes: ResourceItem = {
      id: resId,
      block_id: block.id,
      assignment_id: validAsgId,
      user_id: user.id,
      title,
      type: 'FILE',
      url: fileUrl,
      file_path: filePath,
      file_type: file.type.includes('pdf') ? 'pdf' : file.type.includes('image') ? 'image' : 'notes',
      file_size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploaded_by_name: user.full_name,
      uploaded_by_avatar: user.avatar_url,
      avg_rating: 0,
      ratings_count: 0,
      created_at: new Date().toISOString(),
    };
    setResources((prev) => [newRes, ...prev]);

    if (isSupabaseConfigured) {
      await supabase.from('resources').insert([{
        id: resId,
        block_id: block.id,
        assignment_id: validAsgId,
        user_id: user.id,
        title,
        type: 'FILE',
        url: fileUrl,
        file_path: filePath,
        file_type: newRes.file_type,
        file_size: newRes.file_size,
      }]);
    }
  };

  const addLink = async (url: string, title: string, fileType: any, assignmentId?: string | null) => {
    if (!user || !block) return;
    const resId = generateUUID();
    const validAsgId = assignmentId && !assignmentId.startsWith('asg_sample') ? assignmentId : null;

    const newRes: ResourceItem = {
      id: resId,
      block_id: block.id,
      assignment_id: validAsgId,
      user_id: user.id,
      title,
      type: 'LINK',
      url,
      file_type: fileType || 'link',
      file_size: 'External',
      uploaded_by_name: user.full_name,
      uploaded_by_avatar: user.avatar_url,
      avg_rating: 0,
      ratings_count: 0,
      created_at: new Date().toISOString(),
    };
    setResources((prev) => [newRes, ...prev]);

    if (isSupabaseConfigured) {
      await supabase.from('resources').insert([{
        id: resId,
        block_id: block.id,
        assignment_id: validAsgId,
        user_id: user.id,
        title,
        type: 'LINK',
        url,
        file_type: newRes.file_type,
        file_size: newRes.file_size,
      }]);
    }
  };

  return { resources: enrichedResources, rateResource, uploadFile, addLink, refreshResources: loadResources };
}
