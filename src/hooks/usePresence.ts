import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { PeerPresence, UserProfile } from '@/types';
import { useAuth } from './useAuth';
import { fetchBlockMembers } from '@/lib/authHelpers';

export function usePresence() {
  const { user, block } = useAuth();
  const [peers, setPeers] = useState<PeerPresence[]>([]);
  const [myFocusTaskId, setMyFocusTaskId] = useState<string | undefined>(undefined);
  const [myFocusTaskTitle, setMyFocusTaskTitle] = useState<string | undefined>(undefined);

  // 1. Fetch real block classmates
  const loadClassmates = useCallback(async () => {
    if (!block?.id) {
      setPeers([]);
      return;
    }
    const members = await fetchBlockMembers(block.id);
    const presenceList: PeerPresence[] = members.map((m: UserProfile) => ({
      user_id: m.id,
      user_name: user && m.id === user.id ? `${m.full_name} (You)` : m.full_name,
      user_avatar: m.avatar_url,
      status: user && m.id === user.id ? (myFocusTaskId ? 'focusing' : 'online') : 'online',
      current_task_id: user && m.id === user.id ? myFocusTaskId : undefined,
      current_task_title: user && m.id === user.id ? myFocusTaskTitle : undefined,
      last_seen: new Date().toISOString(),
    }));

    setPeers(presenceList);
  }, [block?.id, user?.id, myFocusTaskId, myFocusTaskTitle]);

  useEffect(() => {
    loadClassmates();
    if (!isSupabaseConfigured || !block?.id || !user?.id) return;

    // Supabase Realtime Presence Channel
    const channel = supabase.channel(`presence_block_${block.id}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setPeers((prev) =>
          prev.map((peer) => {
            const pres = state[peer.user_id]?.[0] as any;
            if (pres) {
              return {
                ...peer,
                status: pres.status || 'online',
                current_task_id: pres.taskId,
                current_task_title: pres.taskTitle,
                last_seen: pres.onlineAt || peer.last_seen,
              };
            }
            return peer;
          })
        );
      })
      .on('presence', { event: 'join' }, () => {
        loadClassmates();
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          loadClassmates();
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: user.id,
            userName: user.full_name,
            status: myFocusTaskId ? 'focusing' : 'online',
            taskId: myFocusTaskId,
            taskTitle: myFocusTaskTitle,
            onlineAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [block?.id, user?.id, myFocusTaskId, myFocusTaskTitle, loadClassmates]);

  const updateMyFocus = (taskId?: string, taskTitle?: string) => {
    setMyFocusTaskId(taskId);
    setMyFocusTaskTitle(taskTitle);
    setPeers((prev) =>
      prev.map((p) => {
        if (user && p.user_id === user.id) {
          return {
            ...p,
            status: taskId ? 'focusing' : 'online',
            current_task_id: taskId,
            current_task_title: taskTitle,
          };
        }
        return p;
      })
    );
  };

  return { peers, myFocusTaskId, myFocusTaskTitle, updateMyFocus, refreshPeers: loadClassmates };
}
