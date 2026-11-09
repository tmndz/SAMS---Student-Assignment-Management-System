import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { UserProfile } from '@/types';
import { useAuth } from './useAuth';
import { MOCK_CLASSMATES } from '@/lib/mockData';

export function useClassmates() {
  const { user, block, isRep } = useAuth();
  const [classmates, setClassmates] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadClassmates = useCallback(async () => {
    if (!block?.id) {
      setClassmates([]);
      return;
    }
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('block_id', block.id)
          .order('role', { ascending: false }); // reps & assistants first

        if (!error && data && data.length > 0) {
          // If current user is in this block, make sure their profile is updated in list
          let list = data as UserProfile[];
          if (user && !list.some((m) => m.id === user.id)) {
            list = [user, ...list];
          }
          setClassmates(list);
          return;
        }
      }

      // Offline / Sample cohort fallback
      let mockList = [...MOCK_CLASSMATES];
      if (user) {
        // Replace or prepend current user with actual state
        mockList = mockList.filter((m) => m.id !== user.id && m.email !== user.email);
        mockList = [user, ...mockList];
      }
      setClassmates(mockList);
    } catch (err) {
      console.warn('Could not load classmates:', err);
    } finally {
      setIsLoading(false);
    }
  }, [block?.id, user]);

  useEffect(() => {
    loadClassmates();
    if (!isSupabaseConfigured || !block?.id) return;

    // Realtime listener for member profiles & role updates in this block
    const channel = supabase
      .channel(`cohort_members_${block.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `block_id=eq.${block.id}`,
        },
        () => {
          loadClassmates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [block?.id, loadClassmates]);

  // Adjust role permissions (Restricted to Block Reps)
  const updateMemberRole = async (
    targetUserId: string,
    newRole: 'student' | 'block_assistant'
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isRep) {
      return { success: false, error: 'Only Block Representatives can adjust role permissions.' };
    }

    // Optimistic local state update
    setClassmates((prev) =>
      prev.map((m) => (m.id === targetUserId ? { ...m, role: newRole } : m))
    );

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ role: newRole, updated_at: new Date().toISOString() })
          .eq('id', targetUserId);

        if (error) {
          console.error('Failed to update role in Supabase:', error);
          await loadClassmates(); // Revert
          return { success: false, error: error.message };
        }
      } catch (err: any) {
        await loadClassmates(); // Revert
        return { success: false, error: err.message };
      }
    }

    return { success: true };
  };

  return {
    classmates,
    isLoading,
    updateMemberRole,
    refreshClassmates: loadClassmates,
  };
}
