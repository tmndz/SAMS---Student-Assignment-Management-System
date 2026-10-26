import React from 'react';
import { Assignment } from '@/types';
import { formatRelativeDeadline, getPriorityBadge } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { CheckCircle2, Clock, FileUp, Sparkles, ArrowRight } from 'lucide-react';

interface PriorityHeroProps {
  assignment: Assignment | null;
  onToggleComplete: (id: string) => void;
  onOpenDetails: (asg: Assignment) => void;
  onUploadMaterial: (asg: Assignment) => void;
}

export const PriorityHero: React.FC<PriorityHeroProps> = ({
  assignment,
  onToggleComplete,
  onOpenDetails,
  onUploadMaterial,
}) => {
  if (!assignment) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/20 p-6 sm:p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white">All Caught Up in Your Block!</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          No pending assignments currently due. Check the resource hub for reviewers or add an upcoming task.
        </p>
      </div>
    );
  }

  const { label: dueLabel, isUrgent } = formatRelativeDeadline(assignment.due_at || assignment.due_date || '');
  const badgeInfo = getPriorityBadge(assignment.priority);
  const completedPeers = assignment.completed_peers || [];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/30 p-5 sm:p-7 shadow-xl shadow-indigo-950/40">
      {/* Subtle background ambient glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
              ⚡ Top Block Priority
            </span>
            <Badge variant={assignment.priority === 'urgent' ? 'urgent' : 'high'} dot>
              {badgeInfo.label} Priority
            </Badge>
            <span className="text-xs font-semibold text-slate-400">
              {assignment.course_code} • {assignment.course_name}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
            {assignment.title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
            {assignment.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${isUrgent ? 'text-rose-400' : 'text-slate-300'}`}>
              <Clock className="w-4 h-4 shrink-0" />
              <span>{dueLabel}</span>
            </div>

            {completedPeers.length > 0 && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="flex -space-x-2">
                  {completedPeers.slice(0, 4).map((p) => (
                    <Avatar key={p.id} name={p.user_name} src={p.user_avatar} size="xs" />
                  ))}
                </div>
                <span className="text-xs font-medium text-emerald-400">
                  {completedPeers.length} block mate{completedPeers.length === 1 ? '' : 's'} done
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-row lg:flex-col items-center sm:items-stretch gap-2.5 shrink-0 pt-2 lg:pt-0">
          <Button
            variant={assignment.is_completed ? 'success' : 'primary'}
            onClick={() => onToggleComplete(assignment.id)}
            className="w-full justify-center"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            {assignment.is_completed ? 'Completed' : 'Mark as Done'}
          </Button>

          <div className="flex items-center gap-2 w-full">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onOpenDetails(assignment)}
              className="flex-1"
            >
              <span>Details</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUploadMaterial(assignment)}
              title="Upload study material"
            >
              <FileUp className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
