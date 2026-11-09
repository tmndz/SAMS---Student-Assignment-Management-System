import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { PeerPresence, UserProfile } from '@/types';
import { useAuth } from './useAuth';
import { fetchBlockMembers } from '@/lib/authHelpers';
import { RealtimeChannel } from '@supabase/supabase-js';

const ONLINE_THRESHOLD_MS = 45 * 1000; // 45 seconds: maximum heartbeat age to consider a user online
const HEARTBEAT_INTERVAL_MS = 15 * 1000; // 15 seconds: frequency of active ping
const SWEEP_INTERVAL_MS = 10 * 1000; // 10 seconds: frequency of local peer sweep

function isWithinOnlineThreshold(timestamp?: string | null): boolean {
  if (!timestamp) return false;
  const time = new Date(timestamp).getTime();
  if (isNaN(time) || time <= 0) return false;
  return Date.now() - time <= ONLINE_THRESHOLD_MS;
}

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
  const bcRef = useRef<BroadcastChannel | null>(null);
  const myFocusTaskIdRef = useRef<string | undefined>(myFocusTaskId);
  const myFocusTaskTitleRef = useRef<string | undefined>(myFocusTaskTitle);
  const userRef = useRef(user);

  // Keep refs in sync without triggering channel re-subscriptions
  useEffect(() => {
    myFocusTaskIdRef.current = myFocusTaskId;
  }, [myFocusTaskId]);

  useEffect(() => {
    myFocusTaskTitleRef.current = myFocusTaskTitle;
  }, [myFocusTaskTitle]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Load real cohort members from DB or mock source, merging existing presence
  const loadClassmates = useCallback(async () => {
    if (!block?.id) {
      setPeers([]);
      return;
    }
    const members = await fetchBlockMembers(block.id);
    const isHidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
    const myCurrentStatus = isHidden ? 'idle' : (myFocusTaskIdRef.current ? 'focusing' : 'online');
    const nowIso = new Date().toISOString();

    setPeers((prevPeers) => {
      const prevMap = new Map<string, PeerPresence>();
      prevPeers.forEach((p) => prevMap.set(p.user_id, p));

      return members.map((m: UserProfile) => {
        const isMe = userRef.current && m.id === userRef.current.id;
        const existing = prevMap.get(m.id);

        if (isMe) {
          return {
            user_id: m.id,
            user_name: `${m.full_name} (You)`,
            user_avatar: userRef.current?.avatar_url || m.avatar_url,
            status: myCurrentStatus,
            current_task_id: myFocusTaskIdRef.current,
            current_task_title: myFocusTaskTitleRef.current,
            last_seen: nowIso,
          };
        }

        // Compare DB last_seen with any recent in-memory last_seen
        const lastSeen = m.last_seen || existing?.last_seen || new Date(0).toISOString();
        const rtPres = channelRef.current?.presenceState()?.[m.id]?.[0] as any;
        const activeTaskId = rtPres?.taskId || m.current_task_id || existing?.current_task_id;
        const activeTaskTitle = rtPres?.taskTitle || m.current_task_title || existing?.current_task_title;

        // Derive active status using Realtime presence OR recent heartbeat timestamp
        let status: 'online' | 'focusing' | 'idle' | 'offline' = 'offline';
        if (rtPres) {
          status = rtPres.status === 'idle'
            ? 'idle'
            : (rtPres.status === 'focusing' || activeTaskId ? 'focusing' : 'online');
        } else if (isWithinOnlineThreshold(lastSeen)) {
          status = activeTaskId ? 'focusing' : 'online';
        }

        return {
          user_id: m.id,
          user_name: m.full_name,
          user_avatar: existing?.user_avatar || m.avatar_url,
          status,
          current_task_id: activeTaskId || undefined,
          current_task_title: activeTaskTitle || undefined,
          last_seen: lastSeen,
        };
      });
    });
  }, [block?.id]);

  // Handle incoming peer heartbeat (ping from BroadcastChannel or Supabase Realtime broadcast)
  const applyPeerHeartbeat = useCallback((payload: {
    userId: string;
    userName?: string;
    userAvatar?: string;
    status?: 'online' | 'focusing' | 'idle' | 'offline';
    taskId?: string | null;
    taskTitle?: string | null;
    timestamp?: string;
  }) => {
    if (!payload.userId || (userRef.current && payload.userId === userRef.current.id)) return;
    const timestamp = payload.timestamp || new Date().toISOString();

    setPeers((prev) =>
      prev.map((peer) => {
        if (peer.user_id === payload.userId) {
          const newStatus = payload.status || (payload.taskId ? 'focusing' : 'online');
          return {
            ...peer,
            user_avatar: payload.userAvatar || peer.user_avatar,
            user_name: payload.userName || peer.user_name,
            status: newStatus,
            current_task_id: payload.taskId || undefined,
            current_task_title: payload.taskTitle || undefined,
            last_seen: timestamp,
          };
        }
        return peer;
      })
    );
  }, []);

  // Handle explicit peer leave notification
  const applyPeerLeave = useCallback((userId: string) => {
    if (!userId || (userRef.current && userId === userRef.current.id)) return;

    setPeers((prev) =>
      prev.map((peer) => {
        if (peer.user_id === userId) {
          return {
            ...peer,
            status: 'offline',
            current_task_id: undefined,
            current_task_title: undefined,
            last_seen: new Date(0).toISOString(),
          };
        }
        return peer;
      })
    );
  }, []);

  // Send a heartbeat ping via BroadcastChannel, Supabase Realtime, and DB profile update
  const sendHeartbeat = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser || !block?.id) return;

    const isHidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
    const currentStatus: 'online' | 'focusing' | 'idle' | 'offline' = isHidden
      ? 'idle'
      : (myFocusTaskIdRef.current ? 'focusing' : 'online');
    const nowIso = new Date().toISOString();

    // 1. Update self in local state immediately
    setPeers((prev) =>
      prev.map((p) =>
        p.user_id === currentUser.id
          ? {
              ...p,
              status: currentStatus,
              current_task_id: myFocusTaskIdRef.current,
              current_task_title: myFocusTaskTitleRef.current,
              user_avatar: currentUser.avatar_url || p.user_avatar,
              last_seen: nowIso,
            }
          : p
      )
    );

    const payload = {
      userId: currentUser.id,
      userName: currentUser.full_name,
      userAvatar: currentUser.avatar_url,
      status: currentStatus,
      taskId: myFocusTaskIdRef.current || null,
      taskTitle: myFocusTaskTitleRef.current || null,
      timestamp: nowIso,
    };

    // 2. Broadcast across local browser tabs
    if (bcRef.current) {
      try {
        bcRef.current.postMessage({ type: 'ping', payload });
      } catch {}
    }

    // 3. Supabase Realtime broadcast and presence tracking
    if (channelRef.current) {
      try {
        channelRef.current.send({
          type: 'broadcast',
          event: 'heartbeat_ping',
          payload,
        });
        channelRef.current.track({
          userId: currentUser.id,
          userName: currentUser.full_name,
          userAvatar: currentUser.avatar_url,
          status: currentStatus,
          taskId: myFocusTaskIdRef.current || null,
          taskTitle: myFocusTaskTitleRef.current || null,
          onlineAt: nowIso,
        });
      } catch {}
    }

    // 4. Update Supabase database last_seen timestamp
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('profiles')
          .update({
            last_seen: nowIso,
            current_task_id: myFocusTaskIdRef.current || null,
            current_task_title: myFocusTaskTitleRef.current || null,
          })
          .eq('id', currentUser.id);
      } catch {}
    }
  }, [block?.id]);

  // Sweep peers: if last_seen exceeds threshold and not present in Realtime, mark offline
  const sweepPeers = useCallback(() => {
    const currentUser = userRef.current;
    if (!currentUser) return;

    setPeers((prev) =>
      prev.map((p) => {
        if (p.user_id === currentUser.id) return p;

        // Check if peer is still in Realtime presence state
        const rtPres = channelRef.current?.presenceState()?.[p.user_id]?.[0] as any;
        if (rtPres) {
          return {
            ...p,
            user_avatar: rtPres.userAvatar || p.user_avatar,
            status: rtPres.status || 'online',
            current_task_id: rtPres.taskId || undefined,
            current_task_title: rtPres.taskTitle || undefined,
            last_seen: rtPres.onlineAt || p.last_seen,
          };
        }

        // Not in Realtime presence; verify last_seen timestamp
        if (isWithinOnlineThreshold(p.last_seen)) {
          return p;
        }

        // Stale timestamp and not in presence = OFFLINE
        if (p.status !== 'offline') {
          return {
            ...p,
            status: 'offline',
            current_task_id: undefined,
            current_task_title: undefined,
          };
        }

        return p;
      })
    );
  }, []);

  // Send leave notification to peers on tab close/unload
  const sendLeave = useCallback(() => {
    const currentUser = userRef.current;
    if (!currentUser || !block?.id) return;

    if (bcRef.current) {
      try {
        bcRef.current.postMessage({ type: 'leave', userId: currentUser.id });
      } catch {}
    }

    if (channelRef.current) {
      try {
        channelRef.current.send({
          type: 'broadcast',
          event: 'peer_leave',
          payload: { userId: currentUser.id },
        });
        channelRef.current.untrack();
      } catch {}
    }

    // Set last_seen in DB to stale so reloaders won't see them as online
    if (isSupabaseConfigured) {
      try {
        supabase
          .from('profiles')
          .update({ last_seen: new Date(Date.now() - 60000).toISOString() })
          .eq('id', currentUser.id)
          .then(() => {});
      } catch {}
    }
  }, [block?.id]);

  // Main lifecycle effect: ONLY connects once per block.id / user.id session
  useEffect(() => {
    loadClassmates();
    if (!block?.id || !user?.id) return;

    // Set up BroadcastChannel for instant local multi-tab messaging
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel(`block_presence_${block.id}`);
        bcRef.current = bc;
        bc.onmessage = (event) => {
          if (event.data?.type === 'ping' && event.data.payload) {
            applyPeerHeartbeat(event.data.payload);
          } else if (event.data?.type === 'leave' && event.data.userId) {
            applyPeerLeave(event.data.userId);
          }
        };
      } catch {}
    }

    // Set up Supabase Realtime Channel
    let channel: RealtimeChannel | null = null;
    if (isSupabaseConfigured) {
      channel = supabase.channel(`presence_block_${block.id}`, {
        config: { presence: { key: user.id } },
      });
      channelRef.current = channel;

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel?.presenceState() || {};
          setPeers((prev) =>
            prev.map((peer) => {
              const isMe = userRef.current && peer.user_id === userRef.current.id;
              if (isMe) return peer;

              const presList = state[peer.user_id];
              const pres = presList?.[0] as any;
              if (pres) {
                const nowIso = pres.onlineAt || new Date().toISOString();
                return {
                  ...peer,
                  user_avatar: pres.userAvatar || peer.user_avatar,
                  status: pres.status || 'online',
                  current_task_id: pres.taskId || undefined,
                  current_task_title: pres.taskTitle || undefined,
                  last_seen: nowIso,
                };
              }

              // Not in presence state right now: check if last_seen is fresh
              if (isWithinOnlineThreshold(peer.last_seen)) {
                return peer;
              }

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
          if (key && key !== userRef.current?.id) {
            applyPeerLeave(key);
          }
        })
        .on('broadcast', { event: 'heartbeat_ping' }, ({ payload }) => {
          if (payload) applyPeerHeartbeat(payload);
        })
        .on('broadcast', { event: 'peer_leave' }, ({ payload }) => {
          if (payload?.userId) applyPeerLeave(payload.userId);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await sendHeartbeat();
          }
        });
    }

    // Initial heartbeat
    sendHeartbeat();

    // Heartbeat & sweep intervals
    const heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    const sweepTimer = setInterval(sweepPeers, SWEEP_INTERVAL_MS);

    // Visibility change handler
    const handleVisibilityChange = () => {
      sendHeartbeat();
    };

    // Before unload handler
    const handleBeforeUnload = () => {
      sendLeave();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      clearInterval(heartbeatTimer);
      clearInterval(sweepTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);

      sendLeave();

      if (bc) {
        bc.close();
        bcRef.current = null;
      }
      if (channel) {
        channelRef.current = null;
        supabase.removeChannel(channel);
      }
    };
  }, [block?.id, user?.id, loadClassmates, sendHeartbeat, sweepPeers, sendLeave, applyPeerHeartbeat, applyPeerLeave]);

  // Update focus and immediately broadcast via heartbeat
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

    // Trigger instant heartbeat broadcast
    sendHeartbeat();
  };

  return { peers, myFocusTaskId, myFocusTaskTitle, updateMyFocus, refreshPeers: loadClassmates };
}
