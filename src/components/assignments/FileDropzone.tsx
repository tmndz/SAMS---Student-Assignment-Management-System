import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface FileDropzoneProps {
  onFileUploaded: (file: { title: string; file_type: 'pdf' | 'notes' | 'slides' | 'code'; file_size: string }) => void;
  assignmentTitle?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({ onFileUploaded, assignmentTitle }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedTitle, setUploadedTitle] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || !files.length) return;
    const file = files[0];
    const extension = file.name.split('.').pop()?.toLowerCase();

    let file_type: 'pdf' | 'notes' | 'slides' | 'code' = 'pdf';
    if (extension === 'pdf') file_type = 'pdf';
    else if (['ppt', 'pptx', 'key'].includes(extension || '')) file_type = 'slides';
    else if (['c', 'cpp', 'py', 'js', 'ts', 'java', 'sql'].includes(extension || '')) file_type = 'code';
    else file_type = 'notes';

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    const sizeStr = `${sizeInMB} MB`;

    onFileUploaded({
      title: file.name.replace(/\.[^/.]+$/, ''),
      file_type,
      file_size: sizeStr,
    });

    setUploadedTitle(file.name);
    setTimeout(() => setUploadedTitle(null), 3000);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => fileInputRef.current?.click()}
      className={cn(
        'group relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all',
        isDragging
          ? 'border-indigo-500 bg-indigo-500/10'
          : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-900/40'
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.py,.c,.java,.ts"
      />

      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
          {uploadedTitle ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <UploadCloud className="w-5 h-5" />
          )}
        </div>

        {uploadedTitle ? (
          <div className="text-xs text-emerald-400 font-semibold">
            Uploaded "{uploadedTitle}" to block!
          </div>
        ) : (
          <>
            <div className="text-xs font-semibold text-slate-300">
              Drop supporting reviewer, PDF or notes here
            </div>
            <p className="text-[11px] text-slate-500">
              PDF, PPTX, C, Python or Notes up to 25MB • Syncs instantly with block mates
            </p>
          </>
        )}
      </div>
    </div>
  );
};
