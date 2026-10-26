import { useState, useEffect } from 'react';
import { AdviceMessage } from '@/types';
import { INITIAL_ADVICE_THREADS } from '@/lib/mockData';
import { useAuth } from './useAuth';

export function useAdvice() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<AdviceMessage[]>(() => {
    const saved = localStorage.getItem('blocksync_advice_threads');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('blocksync_advice_threads', JSON.stringify(threads));
  }, [threads]);

  const sendAdviceRequest = (params: {
    assignmentId: string;
    assignmentTitle: string;
    receiverId: string;
    receiverName: string;
    message: string;
  }) => {
    if (!user) return null;
    const newThread: AdviceMessage = {
      id: `adv_${Date.now()}`,
      assignment_id: params.assignmentId,
      assignment_title: params.assignmentTitle,
      sender_id: user.id,
      sender_name: user.full_name,
      sender_avatar: user.avatar_url,
      receiver_id: params.receiverId,
      receiver_name: params.receiverName,
      message: params.message,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    setThreads((prev) => [newThread, ...prev]);
    return newThread;
  };

  const replyToAdvice = (threadId: string, replyText: string) => {
    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId ? { ...t, reply: replyText, status: 'answered' } : t
      )
    );
  };

  const userThreads = user
    ? threads.filter((t) => t.sender_id === user.id || t.receiver_id === user.id)
    : [];

  return {
    threads: userThreads,
    allThreads: threads,
    sendAdviceRequest,
    replyToAdvice,
  };
}
