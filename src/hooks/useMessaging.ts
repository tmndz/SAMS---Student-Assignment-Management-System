import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Conversation, Message } from '@/types';
import { useAuth } from './useAuth';

export function useMessaging(initialActiveId?: string | null) {
  const { user, block } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(initialActiveId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // 1. Load Conversations
  const loadConversations = useCallback(async () => {
    if (!isSupabaseConfigured || !block.id) return;
    try {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('block_id', block.id)
        .order('created_at', { ascending: false });

      if (data) setConversations(data as Conversation[]);
    } catch (e) {
      console.warn('Failed to load conversations from Supabase:', e);
    }
  }, [block.id]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // 2. Load Messages for Active Conversation
  const loadMessages = useCallback(async (convId: string) => {
    setIsLoadingMessages(true);
    try {
      if (isSupabaseConfigured) {
        const { data } = await supabase
          .from('messages')
          .select('*, sender:profiles(full_name, avatar_url)')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: true });

        if (data) {
          setMessages(data.map((m: any) => ({
            id: m.id,
            conversation_id: m.conversation_id,
            sender_id: m.sender_id,
            assignment_id: m.assignment_id,
            content: m.content,
            sender_name: m.sender?.full_name || 'Classmate',
            sender_avatar: m.sender?.avatar_url,
            created_at: m.created_at,
          })));
        }
      }
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (!activeConversationId) return;
    loadMessages(activeConversationId);

    if (!isSupabaseConfigured) return;

    // Real-time listener for new messages in active conversation
    const channel = supabase
      .channel(`chat_${activeConversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeConversationId}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversationId, loadMessages]);

  // 3. Send Message
  const sendMessage = async (content: string, assignmentId?: string | null) => {
    if (!activeConversationId || !content.trim()) return;

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      conversation_id: activeConversationId,
      sender_id: user.id,
      assignment_id: assignmentId || null,
      content: content.trim(),
      sender_name: `${user.full_name} (You)`,
      sender_avatar: user.avatar_url,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);

    if (isSupabaseConfigured) {
      await supabase.from('messages').insert([{
        id: newMsg.id,
        conversation_id: activeConversationId,
        sender_id: user.id,
        assignment_id: assignmentId || null,
        content: content.trim(),
      }]);
    }
  };

  // 4. Create or Get Direct P2P Advice Conversation
  const getOrCreateDirectConversation = async (peerId: string, peerName: string, assignmentId?: string, assignmentTitle?: string) => {
    const existing = conversations.find((c) => c.type === 'DIRECT' && (c.title?.includes(peerName) || c.assignment_id === assignmentId));
    if (existing) {
      setActiveConversationId(existing.id);
      return existing.id;
    }

    const newConv: Conversation = {
      id: `conv_${Date.now()}`,
      type: 'DIRECT',
      block_id: block.id,
      assignment_id: assignmentId || null,
      title: `Advice: ${peerName} (${assignmentTitle || 'Task'})`,
      created_at: new Date().toISOString(),
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);

    if (isSupabaseConfigured) {
      await supabase.from('conversations').insert([newConv]);
      await supabase.from('conversation_members').insert([
        { conversation_id: newConv.id, user_id: user.id },
        { conversation_id: newConv.id, user_id: peerId },
      ]);
    }
    return newConv.id;
  };

  return {
    conversations, activeConversationId, setActiveConversationId,
    messages, isLoadingMessages, sendMessage, getOrCreateDirectConversation,
    refreshConversations: loadConversations,
  };
}
