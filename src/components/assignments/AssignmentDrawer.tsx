import React from 'react';
import { Assignment, ResourceItem } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { FileDropzone } from './FileDropzone';
import { formatRelativeDeadline, formatDueDate, getPriorityBadge } from '@/lib/utils';
import { CheckCircle2, Clock, BookOpen, MessageSquare, Tag, FileText, Download } from 'lucide-react';

interface AssignmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  resources: ResourceItem[];
  onToggleComplete: (id: string) => void;
  onAskAdvice: (peerId: string, peerName: string, asg: Assignment) => void;
  onUploadFile: (file: { title: string; file_type: 'pdf' | 'notes' | 'slides' | 'code'; file_size: string }) => void;
}

export const AssignmentDrawer: React.FC<AssignmentDrawerProps> = ({
  isOpen,
  onClose,
  assignment,
  resources,
  onToggleComplete,
  onAskAdvice,
  onUploadFile,
}) => {
  if (!assignment) return null;

  const { label: dueLabel, isUrgent } = formatRelativeDeadline(assignment.due_date);
  const badgeInfo = getPriorityBadge(assignment.priority);
  const completedPeers = assignment.completed_peers || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="xl"
      title={
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            {assignment.course_code}
          </span>
          <span className="text-white font-bold">{assignment.course_name}</span>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Title and Badges */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={assignment.priority === 'urgent' ? 'urgent' : 'high'} dot>
              {badgeInfo.label} Priority
            </Badge>
            <span className={`text-xs font-semibold ${isUrgent ? 'text-rose-400' : 'text-slate-400'}`}>
              <Clock className="w-3.5 h-3.5 inline mr-1" />
              {dueLabel} ({formatDueDate(assignment.due_date)})
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white">{assignment.title}</h2>
        </div>

        {/* Instructions */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {assignment.description}
        </div>

        {/* Tags */}
        {assignment.tags && assignment.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Tag className="w-3 h-3 text-slate-500" />
            {assignment.tags.map((tag) => (
              <span key={tag} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/50">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Action Button: Mark Done / Incomplete */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20">
          <span className="text-xs text-slate-300">
            {assignment.is_completed ? 'You marked this task as complete.' : 'Have you completed this task?'}
          </span>
          <Button size="sm" variant={assignment.is_completed ? 'success' : 'primary'} onClick={() => onToggleComplete(assignment.id)}>
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            {assignment.is_completed ? 'Done' : 'Mark as Done'}
          </Button>
        </div>

        {/* Peers who finished */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400">
            <span>Completed Block Mates ({completedPeers.length})</span>
            <span className="text-[11px] text-indigo-400 font-normal">Click to ask advice</span>
          </div>
          {completedPeers.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No block mates have marked this done yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {completedPeers.map((peer) => (
                <div key={peer.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar name={peer.user_name} src={peer.user_avatar} size="xs" />
                    <span className="text-xs font-medium text-white truncate">{peer.user_name}</span>
                  </div>
                  <Button size="sm" variant="outline" className="text-[11px] py-0.5 px-2 h-auto" onClick={() => onAskAdvice(peer.user_id, peer.user_name, assignment)}>
                    <MessageSquare className="w-3 h-3 mr-1 text-indigo-400" />
                    Ask Advice
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shared Study Materials */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Shared Study Materials ({resources.length})</span>
          </h4>
          {resources.length > 0 && (
            <div className="space-y-1.5">
              {resources.map((res) => (
                <div key={res.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="text-slate-200 font-medium truncate">{res.title}</span>
                    <span className="text-[10px] text-slate-500 shrink-0">({res.file_type} • {res.file_size})</span>
                  </div>
                  <button onClick={() => alert(`Simulated download: ${res.title}`)} className="text-indigo-400 hover:text-indigo-300 p-1">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <FileDropzone onFileUploaded={onUploadFile} assignmentTitle={assignment.title} />
        </div>
      </div>
    </Modal>
  );
};
