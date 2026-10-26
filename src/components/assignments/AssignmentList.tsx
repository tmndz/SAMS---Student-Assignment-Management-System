import React, { useState } from 'react';
import { Assignment } from '@/types';
import { AssignmentCard } from './AssignmentCard';
import { CheckCircle2, Plus, LayoutGrid, Layers, BookOpen } from 'lucide-react';
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
  const [isGroupedByCourse, setIsGroupedByCourse] = useState(false);

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

  // Group by Course
  const courseGroups = filtered.reduce((acc, asg) => {
    const key = asg.course_code || 'General';
    if (!acc[key]) acc[key] = { name: asg.course_name || key, items: [] };
    acc[key].items.push(asg);
    return acc;
  }, {} as Record<string, { name: string; items: Assignment[] }>);

  return (
    <div className="space-y-4">
      {/* Top Filter and View Mode Switcher */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          {(['all', 'pending', 'urgent', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-all ${
                filter === tab ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab} ({counts[tab]})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Grouped view toggle */}
          <button
            onClick={() => setIsGroupedByCourse(!isGroupedByCourse)}
            className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isGroupedByCourse
                ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Group by Course"
          >
            {isGroupedByCourse ? <Layers className="w-4 h-4 text-indigo-400" /> : <LayoutGrid className="w-4 h-4" />}
            <span className="hidden sm:inline">{isGroupedByCourse ? 'Grouped by Course' : 'Grid View'}</span>
          </button>

          {onCreateNew && (
            <Button size="sm" variant="primary" onClick={onCreateNew}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Task
            </Button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-10 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No assignments match this view</p>
        </div>
      ) : isGroupedByCourse ? (
        <div className="space-y-6">
          {Object.entries(courseGroups).map(([code, group]) => {
            const completedInCourse = group.items.filter((i) => i.is_completed).length;
            return (
              <div key={code} className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {code}
                    </span>
                    <h4 className="text-sm font-bold text-white">{group.name}</h4>
                  </div>
                  <span className="text-xs text-slate-400">
                    {completedInCourse}/{group.items.length} completed
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.items.map((asg) => (
                    <AssignmentCard
                      key={asg.id}
                      assignment={asg}
                      onToggleComplete={onToggleComplete}
                      onOpenDetails={onOpenDetails}
                      onAskAdvice={onAskAdvice}
                    />
                  ))}
                </div>
              </div>
            );
          })}
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
