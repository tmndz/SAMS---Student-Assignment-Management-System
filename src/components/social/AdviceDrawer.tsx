import React, { useState } from 'react';
import { AdviceMessage } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { MessageSquare, Check, CornerDownRight, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AdviceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  threads: AdviceMessage[];
  currentUserId: string;
  onReply: (threadId: string, replyText: string) => void;
}

export const AdviceDrawer: React.FC<AdviceDrawerProps> = ({
  isOpen,
  onClose,
  threads,
  currentUserId,
  onReply,
}) => {
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleSendReply = (threadId: string) => {
    if (!replyText.trim()) return;
    onReply(threadId, replyText.trim());
    setReplyText('');
    setActiveReplyId(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-400" />
          <span>Peer Advice & Mentorship Hub</span>
        </div>
      }
      description="Questions and study hints shared with classmates who marked tasks done."
      maxWidth="lg"
    >
      <div className="space-y-4">
        {threads.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No active advice threads yet. Ask a classmate on any completed assignment!
          </div>
        ) : (
          threads.map((thread) => {
            const isSender = thread.sender_id === currentUserId;
            const timeAgo = formatDistanceToNow(new Date(thread.created_at), { addSuffix: true });

            return (
              <div
                key={thread.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Avatar name={thread.sender_name} src={thread.sender_avatar} size="xs" />
                    <span className="font-semibold text-white">
                      {isSender ? 'You asked' : `${thread.sender_name} asked`}{' '}
                      <span className="text-indigo-400">
                        {isSender ? thread.receiver_name : 'you'}
                      </span>
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">{timeAgo}</span>
                </div>

                <div className="text-[11px] font-medium text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-md border border-slate-800 inline-block">
                  Assignment: {thread.assignment_title}
                </div>

                <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60">
                  "{thread.message}"
                </p>

                {thread.reply ? (
                  <div className="flex items-start gap-2 pl-3 border-l-2 border-emerald-500/50 mt-2 bg-emerald-500/5 p-2 rounded-r-lg">
                    <CornerDownRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Reply from {thread.receiver_name}:
                      </div>
                      <div className="text-xs text-slate-200 mt-0.5">{thread.reply}</div>
                    </div>
                  </div>
                ) : activeReplyId === thread.id ? (
                  <div className="space-y-2 pt-2">
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your study advice or solution hint..."
                      className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setActiveReplyId(null)}>
                        Cancel
                      </Button>
                      <Button size="sm" variant="primary" onClick={() => handleSendReply(thread.id)}>
                        <Send className="w-3 h-3 mr-1" />
                        Send Reply
                      </Button>
                    </div>
                  </div>
                ) : (
                  !isSender && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveReplyId(thread.id)}
                      className="text-xs py-1"
                    >
                      Reply with Advice
                    </Button>
                  )
                )}
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
};
