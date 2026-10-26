import React, { useState } from 'react';
import { Assignment } from '@/types';
import { AssignmentCard } from './AssignmentCard';
import { CheckCircle2, Clock, AlertCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AssignmentListProps {
  assignments: Assignment[];
  onToggleComplete: (id: string) => void;
  onOpenDetails: (asg: Assignment) => void;
  onAskAdvice?: (peerId: string, peerName: string, asg: Assignment) => void;
  onCreateNew?: () => void;
}

export const AssignmentList: React.FC<AssignmentListProps> = ({
  assignments,
  onToggleComplete,
  onOpenDetails,
  onAskAdvice,
  onCreateNew,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'urgent'>('all');

  const filtered = assignments.filter((asg) => {
    if (filter === 'pending') return !asg.is_completed;
    if (filter === 'completed') return asg.is_completed;
    if (filter === 'urgent') return asg.priority === 'urgent' && !asg.is_completed;
    return true;
  });

  const counts = {
    all: assignments.length,
    pending: assignments.filter((a) => !a.is_completed).length,
    completed: assignments.filter((a) => a.is_completed).length,
    urgent: assignments.filter((a) => a.priority === 'urgent' && !a.is_completed).length,
  };

  return (
    <div className="space-y-4">
      {/* Tab Filter bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${filter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${filter === 'pending' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            Pending ({counts.pending})
          </button>
          <button
            onClick={() => setFilter('urgent')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${filter === 'urgent' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            Urgent ({counts.urgent})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${filter === 'completed' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            Completed ({counts.completed})
          </button>
        </div>

        {onCreateNew && (
          <Button size="sm" variant="primary" onClick={onCreateNew}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Assignment
          </Button>
        )}
      </div>

      {/* Grid of Micro-cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-10 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-slate-300">No assignments in this view</p>
          <p className="text-xs text-slate-500">Everything looks organized!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((asg) => (
            <AssignmentCard
              key={asg.id}
              assignment={asg}
              onToggleComplete={onToggleComplete}
              onOpenDetails={onOpenDetails}
              onAskAdvice={onAskAdvice}
            />
          ))}
        </div>
      )}
    </div>
  );
};
