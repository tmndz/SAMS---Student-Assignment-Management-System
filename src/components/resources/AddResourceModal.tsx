import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Assignment, ResourceType } from '@/types';
import { FileUp, Link2, UploadCloud, BookOpen } from 'lucide-react';

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignments: Assignment[];
  defaultAssignmentId?: string | null;
  onUploadFile: (file: File, title: string, assignmentId?: string | null) => Promise<void>;
  onAddLink: (url: string, title: string, fileType: any, assignmentId?: string | null) => Promise<void>;
}

export const AddResourceModal: React.FC<AddResourceModalProps> = ({
  isOpen,
  onClose,
  assignments,
  defaultAssignmentId,
  onUploadFile,
  onAddLink,
}) => {
  const [tab, setTab] = useState<ResourceType>('FILE');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [linkType, setLinkType] = useState<'link' | 'notes' | 'slides' | 'code'>('link');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [assignmentId, setAssignmentId] = useState<string>(defaultAssignmentId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      if (tab === 'FILE' && selectedFile) {
        await onUploadFile(selectedFile, title.trim(), assignmentId || null);
      } else if (tab === 'LINK' && url.trim()) {
        await onAddLink(url.trim(), title.trim(), linkType, assignmentId || null);
      }
      onClose();
      setTitle('');
      setUrl('');
      setSelectedFile(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <span>Share Study Material with Cohort</span>
        </div>
      }
      description="Upload files (PDFs, cheat sheets) or attach external links (Google Drive, Notion, Gemini Notebook)."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setTab('FILE')}
            className={`py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${tab === 'FILE' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <FileUp className="w-3.5 h-3.5" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setTab('LINK')}
            className={`py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${tab === 'LINK' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <Link2 className="w-3.5 h-3.5" />
            External Link
          </button>
        </div>

        <Input
          label="Resource Title *"
          placeholder="e.g. Peterson Algorithm & POSIX Semaphores Cheat Sheet"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">Link to Assignment (Optional)</label>
          <select
            value={assignmentId}
            onChange={(e) => setAssignmentId(e.target.value)}
            className="w-full rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 text-xs sm:text-sm p-2.5 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">General Cohort Reviewer</option>
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>{a.course_code ? `${a.course_code}: ` : ''}{a.title}</option>
            ))}
          </select>
        </div>

        {tab === 'FILE' ? (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Choose File *</label>
            <div className="border border-dashed border-slate-800 rounded-xl p-3 text-center bg-slate-950/40">
              <input type="file" required onChange={(e) => { const f = e.target.files?.[0]; if (f) { setSelectedFile(f); if (!title) setTitle(f.name.replace(/\.[^/.]+$/, '')); } }} className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white" />
            </div>
          </div>
        ) : (
          <>
            <Input label="URL / Web Link *" placeholder="https://drive.google.com/... or Notion link" value={url} onChange={(e) => setUrl(e.target.value)} icon={<Link2 className="w-4 h-4" />} required />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Category</label>
              <select value={linkType} onChange={(e) => setLinkType(e.target.value as any)} className="w-full rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 text-xs p-2.5 focus:outline-none">
                <option value="notes">Notes / Notion</option>
                <option value="slides">Slides / Presentation</option>
                <option value="code">Code / Repo</option>
                <option value="link">General Link</option>
              </select>
            </div>
          </>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}><UploadCloud className="w-3.5 h-3.5 mr-1.5" />Share Resource</Button>
        </div>
      </form>
    </Modal>
  );
};
