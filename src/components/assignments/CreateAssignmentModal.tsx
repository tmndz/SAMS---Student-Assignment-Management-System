import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { PriorityLevel } from '@/types';
import { Plus, Calendar, BookOpen } from 'lucide-react';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    course_code: string;
    course_name: string;
    description: string;
    due_date: string;
    priority: PriorityLevel;
    tags: string[];
  }) => void;
}

export const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !courseCode || !dueDate) return;

    onSubmit({
      title,
      course_code: courseCode,
      course_name: courseName || courseCode,
      description,
      due_date: new Date(dueDate).toISOString(),
      priority,
      tags: tagInput.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setTitle(''); setCourseCode(''); setCourseName(''); setDescription(''); setDueDate(''); setPriority('medium'); setTagInput('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={<div className="flex items-center gap-2"><Plus className="w-5 h-5 text-indigo-400" /><span>New Block Assignment</span></div>}
      description="Create a shared assignment for everyone in your academic cohort."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Assignment Title *" placeholder="e.g. Process Synchronization Lab" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Course Code *" placeholder="e.g. CS 220" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} required />
          <Input label="Course Name" placeholder="e.g. Operating Systems" value={courseName} onChange={(e) => setCourseName(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Due Date & Time *</label>
            <input type="datetime-local" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 text-sm px-3.5 py-2.5 focus:border-indigo-500 focus:outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Priority Level</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as PriorityLevel)} className="w-full rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 text-sm px-3.5 py-2.5 focus:border-indigo-500 focus:outline-none">
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent Priority</option>
            </select>
          </div>
        </div>
        <Textarea label="Task Description & Guidelines" placeholder="Include submission instructions, requirements..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        <Input label="Tags (Comma separated)" placeholder="e.g. POSIX, C, Concurrency" value={tagInput} onChange={(e) => setTagInput(e.target.value)} />
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" size="sm">Publish to Block</Button>
        </div>
      </form>
    </Modal>
  );
};
