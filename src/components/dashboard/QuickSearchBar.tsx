import React, { useRef, useEffect } from 'react';
import { Search, X, BookOpen, Users, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SearchCategory = 'all' | 'assignments' | 'resources' | 'peers';

interface QuickSearchBarProps {
  value: string;
  onChange: (val: string) => void;
  category: SearchCategory;
  onSelectCategory: (cat: SearchCategory) => void;
  resultsCount?: number;
}

export const QuickSearchBar: React.FC<QuickSearchBarProps> = ({
  value,
  onChange,
  category,
  onSelectCategory,
  resultsCount,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || (e.metaKey && e.key === 'k')) && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const categories = [
    { id: 'all' as const, label: 'All' },
    { id: 'assignments' as const, label: 'Assignments', icon: FileText },
    { id: 'resources' as const, label: 'Reviewers', icon: BookOpen },
    { id: 'peers' as const, label: 'Classmates', icon: Users },
  ];

  return (
    <div className="space-y-2.5">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Filter assignments, study materials, or classmates... (Press / to focus)"
          className="w-full bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs sm:text-sm rounded-xl pl-10 pr-24 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all shadow-sm"
        />

        <div className="absolute right-3 flex items-center gap-1.5 text-[11px] text-slate-500">
          {value ? (
            <button
              onClick={() => onChange('')}
              className="p-1 hover:text-slate-300 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/60 font-mono text-[10px]">
              /
            </kbd>
          )}
          {resultsCount !== undefined && value && (
            <span className="text-[11px] text-indigo-400 font-medium pl-1 border-l border-slate-800">
              {resultsCount} found
            </span>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const active = category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={cn(
                'inline-flex items-center gap-1 px-3 py-1 rounded-lg border text-xs font-medium transition-colors shrink-0',
                active
                  ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-300'
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              )}
            >
              {Icon && <Icon className="w-3 h-3" />}
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
