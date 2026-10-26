import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Assignment } from '@/types';
import { Radio, Check, Sparkles, X } from 'lucide-react';

interface SetFocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignments: Assignment[];
  currentFocusId?: string;
  onSelectFocus: (id?: string, title?: string) => void;
}

export const SetFocusModal: React.FC<SetFocusModalProps> = ({
  isOpen,
  onClose,
  assignments,
  currentFocusId,
  onSelectFocus,
}) => {
  const pending = assignments.filter((a) => !a.is_completed);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-amber-400" />
          <span>Set Your Current Focus</span>
        </div>
      }
      description="Let block mates know what task you're currently working on in the live presence bar."
    >
      <div className="space-y-3">
        {currentFocusId && (
          <button
            type="button"
            onClick={() => {
              onSelectFocus(undefined, undefined);
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs font-semibold hover:bg-rose-500/20 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear Current Focus
          </button>
        )}

        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {pending.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No pending assignments to focus on.</p>
          ) : (
            pending.map((asg) => {
              const isSelected = asg.id === currentFocusId;
              return (
                <div
                  key={asg.id}
                  onClick={() => {
                    onSelectFocus(asg.id, `${asg.course_code}: ${asg.title}`);
                    onClose();
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : 'bg-slate-950/40 border-slate-800 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      {asg.course_code}
                    </span>
                    <span className="text-xs font-semibold truncate block">{asg.title}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
