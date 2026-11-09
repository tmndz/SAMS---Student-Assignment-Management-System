import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { PeerPresence, UserProfile } from '@/types';
import { useAuth } from './useAuth';
import { fetchBlockMembers } from '@/lib/authHelpers';
import { RealtimeChannel } from '@supabase/supabase-js';

export function usePresence() {
  const { user, block } = useAuth();
  const [peers, setPeers] = useState<PeerPresence[]>([]);

  // Load initial focus from localStorage if available
  const [myFocusTaskId, setMyFocusTaskId] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    try {
      const stored = localStorage.getItem(`blocksync_focus_${user?.id || 'guest'}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.taskId;
      }
    } catch {}
    return user?.current_task_id || undefined;
  });

  const [myFocusTaskTitle, setMyFocusTaskTitle] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    try {
      const stored = localStorage.getItem(`blocksync_focus_${user?.id || 'guest'}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.taskTitle;
      }
    } catch {}
    return user?.current_task_title || undefined;
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const myFocusTaskIdRef = useRef<string | undefined>(myFocusTaskId);
  const myFocusTaskTitleRef = useRef<string | undefined>(myFocusTaskTitle);
  const userRef = useRef(user);

  // Keep refs in sync
  useEffect(() => {
    myFocusTaskIdRef.current = myFocusTaskId;
  }, [myFocusTaskId]);

  useEffect(() => {
    myFocusTaskTitleRef.current = myFocusTaskTitle;
  }, [myFocusTaskTitle]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // 1. Fetch real block classmates
  const loadClassmates = useCallback(async () => {
    if (!block?.id) {
      setPeers([]);
      return;
    }
    const members = await fetchBlockMembers(block.id);
    const isHidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
    const myCurrentStatus = isHidden ? 'idle' : (myFocusTaskId ? 'focusing' : 'online');

    const presenceList: PeerPresence[] = members.map((m: UserProfile) => {
      const isMe = user && m.id === user.id;
      return {
        user_id: m.id,
        user_name: isMe ? `${m.full_name} (You)` : m.full_name,
        user_avatar: isMe ? (user.avatar_url || m.avatar_url) : m.avatar_url,
        // CRITICAL FIX: Only the current user starts as active (online/focusing or idle if tab hidden).
        // All other classmates start as 'offline' until verified in the Realtime Presence state.
        status: isMe ? myCurrentStatus : 'offline',
        current_task_id: isMe ? myFocusTaskId : (m.current_task_id || undefined),
        current_task_title: isMe ? myFocusTaskTitle : (m.current_task_title || undefined),
        last_seen: new Date().toISOString(),
      };
    });

    setPeers(presenceList);
  }, [block?.id, user?.id, user?.avatar_url, myFocusTaskId, myFocusTaskTitle]);

  useEffect(() => {
    loadClassmates();
    if (!isSupabaseConfigured || !block?.id || !user?.id) return;

    // Helper to get active presence track payload
    const getPresencePayload = (overrideStatus?: 'online' | 'focusing' | 'idle' | 'offline') => {
      const isHidden = document.visibilityState === 'hidden';
      const status = overrideStatus || (isHidden ? 'idle' : (myFocusTaskIdRef.current ? 'focusing' : 'online'));
      return {
        userId: user.id,
        userName: user.full_name,
        userAvatar: user.avatar_url,
        status,
        taskId: myFocusTaskIdRef.current || null,
        taskTitle: myFocusTaskTitleRef.current || null,
        onlineAt: new Date().toISOString(),
      };
    };

    // Supabase Realtime Presence Channel
    const channel = supabase.channel(`presence_block_${block.id}`, {
      config: { presence: { key: user.id } },
    });
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setPeers((prev) =>
          prev.map((peer) => {
            const isMe = peer.user_id === user.id;
            const presList = state[peer.user_id];
            const pres = presList?.[0] as any;

            if (pres) {
              return {
                ...peer,
                user_avatar: pres.userAvatar || peer.user_avatar,
                status: pres.status || 'online',
                current_task_id: pres.taskId || undefined,
                current_task_title: pres.taskTitle || undefined,
                last_seen: pres.onlineAt || peer.last_seen,
              };
            }

            // If not found in presence state:
            if (isMe) {
              const isHidden = document.visibilityState === 'hidden';
              return {
                ...peer,
                user_avatar: user.avatar_url || peer.user_avatar,
                status: isHidden ? 'idle' : (myFocusTaskIdRef.current ? 'focusing' : 'online'),
                current_task_id: myFocusTaskIdRef.current,
                current_task_title: myFocusTaskTitleRef.current,
              };
            }

            // Other classmate is NOT in Realtime Presence = OFFLINE
            return {
              ...peer,
              status: 'offline',
              current_task_id: undefined,
              current_task_title: undefined,
            };
          })
        );
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        // Classmate left the channel (closed tab, disconnected)
        setPeers((prev) =>
          prev.map((peer) => {
            if (peer.user_id === key && peer.user_id !== user.id) {
              return {
                ...peer,
                status: 'offline',
                current_task_id: undefined,
                current_task_title: undefined,
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
          await channel.track(getPresencePayload());
        }
      });

    // Handle user leaving the screen or minimizing window
    const handleVisibilityChange = () => {
      const isHidden = document.visibilityState === 'hidden';
      const newStatus = isHidden ? 'idle' : (myFocusTaskIdRef.current ? 'focusing' : 'online');

      setPeers((prev) =>
        prev.map((p) => (p.user_id === user.id ? { ...p, status: newStatus } : p))
      );

      if (channelRef.current) {
        channelRef.current.track(getPresencePayload(newStatus)).catch(() => {});
      }
    };

    // Handle closing the tab / navigating away
    const handleBeforeUnload = () => {
      if (channelRef.current) {
        try {
          channelRef.current.untrack();
        } catch {}
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [block?.id, user?.id, user?.avatar_url, loadClassmates]);

  // Update focus and broadcast in real-time to everyone
  const updateMyFocus = (taskId?: string, taskTitle?: string) => {
    setMyFocusTaskId(taskId);
    setMyFocusTaskTitle(taskTitle);
    myFocusTaskIdRef.current = taskId;
    myFocusTaskTitleRef.current = taskTitle;

    // Persist locally
    if (typeof window !== 'undefined' && user?.id) {
      if (taskId) {
        localStorage.setItem(`blocksync_focus_${user.id}`, JSON.stringify({ taskId, taskTitle }));
      } else {
        localStorage.removeItem(`blocksync_focus_${user.id}`);
      }
    }

    // Update local state immediately
    const newStatus = taskId ? 'focusing' : 'online';
    setPeers((prev) =>
      prev.map((p) => {
        if (user && p.user_id === user.id) {
          return {
            ...p,
            user_avatar: user.avatar_url || p.user_avatar,
            status: newStatus,
            current_task_id: taskId,
            current_task_title: taskTitle,
          };
        }
        return p;
      })
    );

    // Broadcast update to all classmates via Realtime Presence
    if (channelRef.current && user) {
      channelRef.current.track({
        userId: user.id,
        userName: user.full_name,
        userAvatar: user.avatar_url,
        status: newStatus,
        taskId: taskId || null,
        taskTitle: taskTitle || null,
        onlineAt: new Date().toISOString(),
      }).catch((err) => console.warn('Could not broadcast task focus:', err));
    }

    // Persist to Supabase profiles table for persistence across sessions
    if (isSupabaseConfigured && user?.id) {
      supabase
        .from('profiles')
        .update({
          current_task_id: taskId || null,
          current_task_title: taskTitle || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) console.warn('Could not persist task focus to profile:', error);
        });
    }
  };

  return { peers, myFocusTaskId, myFocusTaskTitle, updateMyFocus, refreshPeers: loadClassmates };
}
