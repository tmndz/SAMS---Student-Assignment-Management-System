import React from 'react';
import { Assignment } from '@/types';
import { formatRelativeDeadline, getPriorityBadge } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { CheckCircle2, Clock, FileText, ChevronRight, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssignmentCardProps {
  assignment: Assignment;
  onToggleComplete: (id: string) => void;
  onOpenDetails: (asg: Assignment) => void;
  onAskAdvice?: (peerId: string, peerName: string, asg: Assignment) => void;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  onToggleComplete,
  onOpenDetails,
  onAskAdvice,
}) => {
  const { label: dueLabel, isUrgent, isPastDue } = formatRelativeDeadline(assignment.due_at || assignment.due_date || '');
  const badgeInfo = getPriorityBadge(assignment.priority);
  const completedPeers = assignment.completed_peers || [];

  return (
    <div
      className={cn(
        'group relative rounded-2xl bg-slate-900/80 border p-4 sm:p-5 transition-all duration-200 hover:shadow-lg hover:border-slate-700/80 flex flex-col justify-between gap-4',
        assignment.is_completed
          ? 'border-emerald-500/20 bg-emerald-950/5'
          : isPastDue
          ? 'border-rose-500/30'
          : 'border-slate-800/80'
      )}
    >
      <div className="space-y-2.5">
        {/* Top Badges & Course code */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/50">
              {assignment.course_code}
            </span>
            <Badge variant={assignment.priority === 'urgent' ? 'urgent' : assignment.priority === 'high' ? 'high' : 'neutral'} dot>
              {badgeInfo.label}
            </Badge>
          </div>

          {/* Quick Mark Complete Button */}
          <button
            onClick={() => onToggleComplete(assignment.id)}
            title={assignment.is_completed ? 'Mark as incomplete' : 'Mark as done'}
            className={cn(
              'p-1.5 rounded-xl border transition-all',
              assignment.is_completed
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30'
            )}
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <h3
          onClick={() => onOpenDetails(assignment)}
          className={cn(
            'text-sm sm:text-base font-bold text-white group-hover:text-indigo-300 transition-colors cursor-pointer line-clamp-1',
            assignment.is_completed && 'line-through text-slate-400'
          )}
        >
          {assignment.title}
        </h3>

        {/* Due date countdown */}
        <div className="flex items-center gap-1.5 text-xs">
          <Clock className={cn('w-3.5 h-3.5 shrink-0', isUrgent ? 'text-rose-400' : 'text-slate-400')} />
          <span className={isUrgent ? 'text-rose-400 font-semibold' : 'text-slate-400'}>
            {dueLabel}
          </span>
        </div>
      </div>

      {/* Card Footer: Peer Completion Faces & Details link */}
      <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {completedPeers.length > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5 overflow-hidden">
                {completedPeers.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    title={`${p.user_name} (Done)`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAskAdvice?.(p.user_id, p.user_name, assignment);
                    }}
                    className="cursor-pointer hover:scale-110 transition-transform"
                  >
                    <Avatar name={p.user_name} src={p.user_avatar} size="xs" />
                  </div>
                ))}
              </div>
              <span className="text-[11px] font-medium text-emerald-400 shrink-0">
                {completedPeers.length} done
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <HelpCircle className="w-3 h-3" /> No peers done yet
            </span>
          )}
        </div>

        <button
          onClick={() => onOpenDetails(assignment)}
          className="text-xs font-semibold text-slate-400 group-hover:text-indigo-400 flex items-center gap-0.5 transition-colors shrink-0"
        >
          <span>View</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
