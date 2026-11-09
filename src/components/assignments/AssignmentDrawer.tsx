import React, { useState } from 'react';
import { Assignment, ResourceItem, canModerate } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/resources/StarRating';
import { AssignmentDescription } from '@/components/assignments/AssignmentDescription';
import { formatRelativeDeadline, formatDueDate, getPriorityBadge } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  CheckCircle2,
  Clock,
  BookOpen,
  MessageSquare,
  ExternalLink,
  Lock,
  Trash2,
} from 'lucide-react';

interface AssignmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  resources: ResourceItem[];
  onToggleComplete: (id: string) => void;
  onAskAdvice: (peerId: string, peerName: string, asg: Assignment) => void;
  onOpenAddResource: () => void;
  onRateResource?: (resourceId: string, rating: number) => void;
  onDeleteAssignment?: (id: string) => void;
  onDeleteResource?: (id: string) => void;
}

export const AssignmentDrawer: React.FC<AssignmentDrawerProps> = ({
  isOpen,
  onClose,
  assignment,
  resources,
  onToggleComplete,
  onAskAdvice,
  onOpenAddResource,
  onRateResource,
  onDeleteAssignment,
  onDeleteResource,
}) => {
  const { user } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!assignment) return null;

  const { label: dueLabel, isUrgent } = formatRelativeDeadline(
    assignment.due_at || assignment.due_date || ''
  );
  const badgeInfo = getPriorityBadge(assignment.priority);
  const completedPeers = assignment.completed_peers || [];
  const sortedResources = [...resources].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));

  const userCanDeleteAssignment =
    Boolean(user) && (assignment.created_by === user?.id || canModerate(user));

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    onDeleteAssignment?.(assignment.id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="xl"
      title={
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            {assignment.course_code || 'COURSE'}
          </span>
          <span className="text-white font-bold truncate max-w-sm">{assignment.course_name}</span>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Header details */}
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant={assignment.priority === 'urgent' ? 'urgent' : 'high'} dot>
              {badgeInfo.label} Priority
            </Badge>
            <span className={`text-xs font-semibold ${isUrgent ? 'text-rose-400' : 'text-slate-400'}`}>
              <Clock className="w-3.5 h-3.5 inline mr-1" />
              {dueLabel} ({formatDueDate(assignment.due_at || assignment.due_date || '')})
            </span>
            {assignment.canvas_url && (
              <a
                href={assignment.canvas_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20"
              >
                <span>Canvas LMS</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <h2 className="text-lg font-bold text-white">{assignment.title}</h2>
        </div>

        {/* Rich-Text Preserved Description */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <AssignmentDescription
            htmlContent={assignment.description_html}
            plainContent={assignment.description}
          />
        </div>

        {assignment.lock_at && (
          <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
            <Lock className="w-3.5 h-3.5" />
            <span>Locks on Canvas: {formatDueDate(assignment.lock_at)}</span>
          </div>
        )}

        {/* Completion status bar */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20">
          <span className="text-xs text-slate-300">
            {assignment.is_completed ? 'You marked this task as complete.' : 'Have you completed this task?'}
          </span>
          <Button
            size="sm"
            variant={assignment.is_completed ? 'success' : 'primary'}
            onClick={() => onToggleComplete(assignment.id)}
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            {assignment.is_completed ? 'Done' : 'Mark as Done'}
          </Button>
        </div>

        {/* Peers who finished */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400">
            <span>Completed Classmates ({completedPeers.length})</span>
            <span className="text-[11px] text-indigo-400 font-normal">Click to ask for advice</span>
          </div>
          {completedPeers.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No block mates have marked this done yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {completedPeers.map((peer) => (
                <div
                  key={peer.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar name={peer.user_name} src={peer.user_avatar} size="xs" />
                    <span className="text-xs font-medium text-white truncate">{peer.user_name}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[11px] py-0.5 px-2 h-auto"
                    onClick={() => onAskAdvice(peer.user_id, peer.user_name, assignment)}
                  >
                    <MessageSquare className="w-3 h-3 mr-1 text-indigo-400" />
                    Ask Advice
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Community Rated Materials */}
        <div className="space-y-2 pt-1 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Community-Rated Materials ({sortedResources.length})</span>
            </h4>
            <Button size="sm" variant="outline" className="text-[11px] h-7" onClick={onOpenAddResource}>
              + Add Material
            </Button>
          </div>

          <div className="space-y-1.5">
            {sortedResources.map((res) => {
              const canDeleteRes =
                Boolean(user) && (res.user_id === user?.id || canModerate(user));
              return (
                <div
                  key={res.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="font-medium text-slate-200 truncate">{res.title}</div>
                    <StarRating
                      rating={res.avg_rating}
                      ratingsCount={res.ratings_count}
                      userRating={res.user_rating}
                      onRate={onRateResource ? (s) => onRateResource(res.id, s) : undefined}
                    />
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 p-1"
                      title="Open Resource"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    {canDeleteRes && onDeleteResource && (
                      <button
                        onClick={() => onDeleteResource(res.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Delete Resource"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RBAC Deletion footer for assignment */}
        {userCanDeleteAssignment && onDeleteAssignment && (
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              {assignment.created_by === user?.id ? 'You created this task' : 'Moderator permissions active'}
            </span>
            <Button
              size="sm"
              variant="danger"
              className="text-xs"
              onClick={handleDelete}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              <span>{confirmDelete ? 'Click again to confirm delete' : 'Delete Task'}</span>
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
