import { useState, useEffect } from 'react';
import { PeerPresence } from '@/types';
import { INITIAL_PRESENCE } from '@/lib/mockData';
import { useAuth } from './useAuth';

export function usePresence() {
  const { user } = useAuth();
  const [peers, setPeers] = useState<PeerPresence[]>(() => {
    const saved = localStorage.getItem('blocksync_presence_v1');
    return saved ? JSON.parse(saved) : INITIAL_PRESENCE;
  });

  const [myFocusTaskId, setMyFocusTaskId] = useState<string | undefined>(undefined);
  const [myFocusTaskTitle, setMyFocusTaskTitle] = useState<string | undefined>(undefined);

  useEffect(() => {
    localStorage.setItem('blocksync_presence_v1', JSON.stringify(peers));
  }, [peers]);

  const updateMyFocus = (taskId?: string, taskTitle?: string) => {
    setMyFocusTaskId(taskId);
    setMyFocusTaskTitle(taskTitle);

    setPeers((prev) => {
      const existing = prev.find((p) => p.user_id === user.id);
      const updated: PeerPresence = {
        user_id: user.id,
        user_name: `${user.full_name} (You)`,
        user_avatar: user.avatar_url,
        status: taskId ? 'focusing' : 'online',
        current_task_id: taskId,
        current_task_title: taskTitle,
        last_seen: new Date().toISOString(),
      };

      if (existing) {
        return prev.map((p) => (p.user_id === user.id ? updated : p));
      }
      return [updated, ...prev];
    });
  };

  const onlinePeers = peers.filter((p) => p.status === 'online' || p.status === 'focusing');

  return {
    peers,
    onlinePeers,
    myFocusTaskId,
    myFocusTaskTitle,
    updateMyFocus,
  };
}
