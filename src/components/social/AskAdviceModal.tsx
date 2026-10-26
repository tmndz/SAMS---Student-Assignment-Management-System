import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Send, HelpCircle, CheckCircle2 } from 'lucide-react';

interface AskAdviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  peerName: string;
  peerAvatar?: string;
  peerId: string;
  assignmentId: string;
  assignmentTitle: string;
  onSendAdvice: (params: {
    assignmentId: string;
    assignmentTitle: string;
    receiverId: string;
    receiverName: string;
    message: string;
  }) => void;
}

export const AskAdviceModal: React.FC<AskAdviceModalProps> = ({
  isOpen,
  onClose,
  peerName,
  peerAvatar,
  peerId,
  assignmentId,
  assignmentTitle,
  onSendAdvice,
}) => {
  const [message, setMessage] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  const quickPrompts = [
    'How did you approach problem #2?',
    'Any edge cases I should watch out for in testing?',
    'Which reference material or reviewer helped you most?',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    onSendAdvice({
      assignmentId,
      assignmentTitle,
      receiverId: peerId,
      receiverName: peerName,
      message: message.trim(),
    });

    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      setMessage('');
      onClose();
    }, 1200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-400" />
          <span>Ask Classmate for Advice</span>
        </div>
      }
      description={`Connect with ${peerName} who already finished this task.`}
    >
      {sentSuccess ? (
        <div className="py-8 text-center space-y-2 animate-in zoom-in-95">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white">Advice Request Sent!</h4>
          <p className="text-xs text-slate-400">
            {peerName} has been notified in your block activity feed.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <Avatar name={peerName} src={peerAvatar} size="sm" status="online" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-white">{peerName}</div>
              <div className="text-[11px] text-slate-400 truncate">
                Completed "{assignmentTitle}"
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Quick question starters:</label>
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setMessage(prompt)}
                  className="text-[11px] text-left px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/50 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Your Message:</label>
            <textarea
              required
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Hi ${peerName}, I was wondering if you could share a hint on...`}
              className="w-full rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs sm:text-sm p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={!message.trim()}>
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Send Question
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
