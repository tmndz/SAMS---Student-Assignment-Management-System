import { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Assignment, Course, PeerCompletion, PriorityLevel } from '@/types';
import { INITIAL_ASSIGNMENTS } from '@/lib/mockData';
import { useAuth } from './useAuth';

export function useAssignments() {
  const { user, block } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem('blocksync_assignments_v2');
    return saved ? JSON.parse(saved) : INITIAL_ASSIGNMENTS;
  });

  const [courses, setCourses] = useState<Course[]>([]);

  // 1. Load Assignments, Courses, and Completions from Supabase
  const loadData = useCallback(async () => {
    if (!isSupabaseConfigured || !block.id) return;
    try {
      const { data: crsData } = await supabase.from('courses').select('*').eq('block_id', block.id);
      if (crsData) setCourses(crsData as Course[]);

      const { data: asgData } = await supabase.from('assignments').select('*').eq('block_id', block.id).order('due_at', { ascending: true });
      const { data: cmpData } = await supabase.from('completions').select('*, profile:profiles(full_name, avatar_url)');

      if (asgData) {
        const enriched: Assignment[] = asgData.map((a: any) => {
          const peers: PeerCompletion[] = (cmpData || [])
            .filter((c: any) => c.assignment_id === a.id)
            .map((c: any) => ({
              id: c.id,
              assignment_id: c.assignment_id,
              user_id: c.user_id,
              user_name: c.profile?.full_name || 'Classmate',
              user_avatar: c.profile?.avatar_url,
              completed_at: c.completed_at,
              confidence_rating: c.confidence_rating,
            }));

          const isDone = peers.some((p) => p.user_id === user.id);
          const crs = crsData?.find((c) => c.id === a.course_id);

          return {
            ...a,
            course_code: crs?.course_code || a.course_code || 'CS',
            course_name: crs?.title || a.course_name || 'Course',
            is_completed: isDone,
            completed_by_count: peers.length,
            completed_peers: peers,
          };
        });
        setAssignments(enriched);
      }
    } catch (e) {
      console.warn('Could not load Supabase assignments:', e);
    }
  }, [block.id, user.id]);

  useEffect(() => {
    loadData();
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('realtime_assignments_completions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'completions' }, () => loadData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  // Priority Hero: single most urgent upcoming non-completed assignment
  const priorityHero = useMemo(() => {
    const pending = assignments.filter((a) => !a.is_completed);
    if (!pending.length) return null;
    return [...pending].sort((a, b) => new Date(a.due_at || a.due_date || '').getTime() - new Date(b.due_at || b.due_date || '').getTime())[0];
  }, [assignments]);

  // Toggle Completion
  const toggleCompletion = async (assignmentId: string) => {
    const target = assignments.find((a) => a.id === assignmentId);
    if (!target) return;
    const willBeCompleted = !target.is_completed;

    if (willBeCompleted) {
      try {
        confetti({ particleCount: 65, spread: 60, origin: { y: 0.7 }, colors: ['#6366f1', '#a855f7', '#3b82f6', '#10b981'] });
      } catch {}
    }

    // Optimistic state
    setAssignments((prev) =>
      prev.map((asg) => {
        if (asg.id !== assignmentId) return asg;
        const peers = asg.completed_peers || [];
        const updatedPeers = willBeCompleted
          ? [{ id: `cmp_${Date.now()}`, assignment_id: asg.id, user_id: user.id, user_name: `${user.full_name} (You)`, user_avatar: user.avatar_url, completed_at: new Date().toISOString() }, ...peers]
          : peers.filter((p) => p.user_id !== user.id);
        return { ...asg, is_completed: willBeCompleted, completed_by_count: updatedPeers.length, completed_peers: updatedPeers };
      })
    );

    if (isSupabaseConfigured && user.id) {
      if (willBeCompleted) {
        await supabase.from('completions').upsert({ assignment_id: assignmentId, user_id: user.id, completed_at: new Date().toISOString() });
      } else {
        await supabase.from('completions').delete().match({ assignment_id: assignmentId, user_id: user.id });
      }
    }
  };

  const createAssignment = async (data: {
    title: string; course_code: string; course_name: string; description: string; due_date: string; priority: PriorityLevel; tags: string[];
  }) => {
    const newAsg: Assignment = {
      id: `asg_${Date.now()}`,
      block_id: block.id,
      title: data.title,
      course_code: data.course_code.toUpperCase(),
      course_name: data.course_name,
      description: data.description,
      due_at: data.due_date,
      due_date: data.due_date,
      priority: data.priority,
      tags: data.tags,
      created_by: user.id,
      created_by_name: `${user.full_name}${user.role === 'rep' ? ' (Rep)' : ''}`,
      created_at: new Date().toISOString(),
      is_completed: false,
      completed_by_count: 0,
      completed_peers: [],
    };

    setAssignments((prev) => [newAsg, ...prev]);
    if (isSupabaseConfigured) {
      await supabase.from('assignments').insert([{
        id: newAsg.id, block_id: block.id, title: newAsg.title, description: newAsg.description,
        due_at: newAsg.due_at, priority: newAsg.priority, tags: newAsg.tags, created_by: user.id,
      }]);
    }
    return newAsg;
  };

  return { assignments, courses, priorityHero, toggleCompletion, createAssignment, refreshAssignments: loadData };
}
