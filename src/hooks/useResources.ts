import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ResourceItem } from '@/types';
import { INITIAL_RESOURCES } from '@/lib/mockData';
import { useAuth } from './useAuth';
import { uploadStudyFile } from '@/lib/storageHelpers';

export function useResources() {
  const { user, block } = useAuth();
  const [resources, setResources] = useState<ResourceItem[]>(() => {
    const saved = localStorage.getItem('blocksync_resources_v2');
    return saved ? JSON.parse(saved) : INITIAL_RESOURCES;
  });
  const [ratings, setRatings] = useState<Record<string, { avg: number; count: number; userScore: number | null }>>({});

  const loadResources = useCallback(async () => {
    if (!isSupabaseConfigured || !block.id) return;
    try {
      const { data: resData } = await supabase.from('resources').select('*').eq('block_id', block.id).order('created_at', { ascending: false });
      if (resData?.length) setResources(resData as ResourceItem[]);

      const { data: ratData } = await supabase.from('resource_ratings').select('*');
      if (ratData) {
        const ratingMap: Record<string, { total: number; count: number; userScore: number | null }> = {};
        for (const r of ratData) {
          if (!ratingMap[r.resource_id]) ratingMap[r.resource_id] = { total: 0, count: 0, userScore: null };
          ratingMap[r.resource_id].total += r.rating;
          ratingMap[r.resource_id].count += 1;
          if (r.user_id === user.id) ratingMap[r.resource_id].userScore = r.rating;
        }
        const computed: Record<string, { avg: number; count: number; userScore: number | null }> = {};
        for (const [id, stats] of Object.entries(ratingMap)) {
          computed[id] = { avg: stats.count > 0 ? stats.total / stats.count : 0, count: stats.count, userScore: stats.userScore };
        }
        setRatings(computed);
      }
    } catch (err) {
      console.warn('Could not load Supabase resources:', err);
    }
  }, [block.id, user.id]);

  useEffect(() => {
    loadResources();
    if (!isSupabaseConfigured) return;
    const channel = supabase.channel('realtime_resources')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, () => loadResources())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resource_ratings' }, () => loadResources())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadResources]);

  const enrichedResources = useMemo(() => {
    return resources.map((r) => ({
      ...r,
      avg_rating: ratings[r.id]?.avg ?? r.avg_rating ?? 5.0,
      ratings_count: ratings[r.id]?.count ?? r.ratings_count ?? 3,
      user_rating: ratings[r.id]?.userScore ?? r.user_rating ?? null,
    }));
  }, [resources, ratings]);

  const rateResource = async (resourceId: string, rating: number) => {
    setRatings((prev) => {
      const existing = prev[resourceId] || { avg: rating, count: 0, userScore: null };
      return { ...prev, [resourceId]: { avg: rating, count: existing.userScore ? existing.count : existing.count + 1, userScore: rating } };
    });
    if (isSupabaseConfigured && user.id) {
      await supabase.from('resource_ratings').upsert({ resource_id: resourceId, user_id: user.id, rating }, { onConflict: 'resource_id,user_id' });
    }
  };

  const uploadFile = async (file: File, title: string, assignmentId?: string | null) => {
    const { fileUrl, filePath } = await uploadStudyFile(file, block.id);
    const newRes: ResourceItem = {
      id: `res_${Date.now()}`,
      block_id: block.id,
      assignment_id: assignmentId || null,
      user_id: user.id,
      title,
      type: 'FILE',
      url: fileUrl,
      file_path: filePath,
      file_type: file.type.includes('pdf') ? 'pdf' : file.type.includes('image') ? 'image' : 'notes',
      file_size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploaded_by_name: user.full_name,
      uploaded_by_avatar: user.avatar_url,
      avg_rating: 5.0,
      ratings_count: 1,
      created_at: new Date().toISOString(),
    };
    setResources((prev) => [newRes, ...prev]);
    if (isSupabaseConfigured) await supabase.from('resources').insert([newRes]);
  };

  const addLink = async (url: string, title: string, fileType: any, assignmentId?: string | null) => {
    const newRes: ResourceItem = {
      id: `res_${Date.now()}`,
      block_id: block.id,
      assignment_id: assignmentId || null,
      user_id: user.id,
      title,
      type: 'LINK',
      url,
      file_type: fileType || 'link',
      file_size: 'External',
      uploaded_by_name: user.full_name,
      uploaded_by_avatar: user.avatar_url,
      avg_rating: 5.0,
      ratings_count: 1,
      created_at: new Date().toISOString(),
    };
    setResources((prev) => [newRes, ...prev]);
    if (isSupabaseConfigured) await supabase.from('resources').insert([newRes]);
  };

  return { resources: enrichedResources, rateResource, uploadFile, addLink, refreshResources: loadResources };
}
