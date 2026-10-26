import React, { useState } from 'react';
import { ResourceItem, Assignment } from '@/types';
import { FileDropzone } from '@/components/assignments/FileDropzone';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { BookOpen, FileText, Download, Code, Presentation, Plus, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ResourceHubProps {
  resources: ResourceItem[];
  assignments: Assignment[];
  onUploadResource: (data: {
    assignment_id?: string | null;
    assignment_title?: string;
    title: string;
    file_type: 'pdf' | 'notes' | 'slides' | 'code';
    file_size?: string;
  }) => void;
}

export const ResourceHub: React.FC<ResourceHubProps> = ({
  resources,
  assignments,
  onUploadResource,
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showUploader, setShowUploader] = useState(false);

  const filtered = resources.filter((r) => {
    if (selectedType === 'all') return true;
    return r.file_type === selectedType;
  });

  const getFileIcon = (type: ResourceItem['file_type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-rose-400" />;
      case 'slides':
        return <Presentation className="w-4 h-4 text-amber-400" />;
      case 'code':
        return <Code className="w-4 h-4 text-emerald-400" />;
      default:
        return <BookOpen className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
          {['all', 'pdf', 'notes', 'slides', 'code'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg font-medium uppercase text-[11px] transition-all ${
                selectedType === type ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <Button size="sm" variant="outline" onClick={() => setShowUploader(!showUploader)}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          {showUploader ? 'Hide Uploader' : 'Share Material'}
        </Button>
      </div>

      {showUploader && (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-indigo-500/30 animate-in fade-in">
          <h4 className="text-xs font-bold text-white mb-2">Upload Shared Material to Cohort</h4>
          <FileDropzone
            onFileUploaded={(file) => {
              onUploadResource(file);
              setShowUploader(false);
            }}
          />
        </div>
      )}

      {/* Grid of Resource Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-10 text-center space-y-2">
          <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No resources found in this filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-slate-900/80 border border-slate-800/80 p-4 hover:border-slate-700 transition-all flex flex-col justify-between gap-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="p-1.5 rounded-lg bg-slate-800 border border-slate-700/60">
                    {getFileIcon(item.file_type)}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">{item.file_size}</span>
                </div>

                <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug">{item.title}</h4>

                {item.assignment_title && (
                  <p className="text-[11px] text-indigo-400 truncate">
                    Linked: {item.assignment_title}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Avatar name={item.uploaded_by_name} src={item.uploaded_by_avatar} size="xs" />
                  <span className="text-[11px] text-slate-400 truncate">{item.uploaded_by_name}</span>
                </div>

                <button
                  onClick={() => alert(`Simulated download: ${item.title}`)}
                  className="p-1 text-slate-400 hover:text-indigo-400 transition-colors"
                  title="Download resource"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
