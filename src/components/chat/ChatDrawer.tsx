import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Conversation, Message } from '@/types';
import { MessageSquare, Send, Hash, Users, Sparkles, BookOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeConvId: string | null;
  onSelectConv: (id: string) => void;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (text: string) => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  conversations,
  activeConvId,
  onSelectConv,
  messages,
  currentUserId,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-400" />
          <span>Peer Collaboration & Advice Engine</span>
        </div>
      }
      description="Direct 1-on-1 assignment advice threads & block-wide study channels."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 h-[480px]">
        {/* Left: Channels & Direct Threads List */}
        <div className="border border-slate-800 rounded-xl bg-slate-950/60 p-2 overflow-y-auto space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1">
            Channels & Threads
          </div>
          {conversations.length === 0 ? (
            <div className="text-xs text-slate-500 p-2 italic">No active conversations. Click "Ask Advice" on a peer!</div>
          ) : (
            conversations.map((c) => {
              const isSelected = c.id === activeConvId;
              return (
                <button
                  key={c.id}
                  onClick={() => onSelectConv(c.id)}
                  className={`w-full text-left p-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
                    isSelected ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  {c.type === 'GROUP' ? <Hash className="w-3.5 h-3.5 shrink-0" /> : <Users className="w-3.5 h-3.5 shrink-0 text-amber-400" />}
                  <span className="truncate">{c.title || 'Advice Thread'}</span>
                </button>
              );
            })
          )}
        </div>

        {/* Right: Active Chat View */}
        <div className="md:col-span-2 border border-slate-800 rounded-xl bg-slate-950/40 flex flex-col justify-between overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-between">
            <span className="text-xs font-bold text-white truncate">
              {activeConv?.title || 'Select a Conversation'}
            </span>
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Realtime
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs space-y-1">
                <Sparkles className="w-6 h-6 text-indigo-400" />
                <p>Start the conversation! Ask for advice or share study notes.</p>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.sender_id === currentUserId;
                return (
                  <div key={m.id} className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && <Avatar name={m.sender_name || 'Peer'} src={m.sender_avatar} size="xs" />}
                    <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                      isMe ? 'bg-indigo-600 text-white rounded-br-xs' : 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700/60'
                    }`}>
                      {!isMe && <div className="text-[10px] font-bold text-indigo-300 mb-0.5">{m.sender_name}</div>}
                      <p>{m.content}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSend} className="p-2.5 border-t border-slate-800 bg-slate-900/40 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type message or study question..."
              className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <Button type="submit" size="sm" variant="primary" disabled={!inputText.trim()}>
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>
      </div>
    </Modal>
  );
};
