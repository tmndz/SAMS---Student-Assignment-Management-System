import React, { useState } from 'react';
import { ResourceItem, Assignment } from '@/types';
import { StarRating } from './StarRating';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { BookOpen, FileText, Download, ExternalLink, Plus, Star, Sparkles, Filter } from 'lucide-react';

interface ResourceHubProps {
  resources: ResourceItem[];
  assignments: Assignment[];
  onOpenAddResource: () => void;
  onRateResource: (resourceId: string, rating: number) => void;
}

export const ResourceHub: React.FC<ResourceHubProps> = ({
  resources,
  assignments,
  onOpenAddResource,
  onRateResource,
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'newest'>('rating');

  const filtered = resources
    .filter((r) => selectedType === 'all' || r.file_type === selectedType)
    .sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.avg_rating || 0) - (a.avg_rating || 0);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
            {['all', 'pdf', 'notes', 'slides', 'code', 'link'].map((type) => (
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

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
            <button
              onClick={() => setSortBy('rating')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                sortBy === 'rating' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'text-slate-400'
              }`}
            >
              <Star className="w-3 h-3 text-amber-400" /> Top Rated
            </button>
            <button
              onClick={() => setSortBy('newest')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                sortBy === 'newest' ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              <Sparkles className="w-3 h-3" /> Newest
            </button>
          </div>
        </div>

        <Button size="sm" variant="primary" onClick={onOpenAddResource}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Share Material
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-10 text-center space-y-2">
          <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No resources found in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 hover:border-slate-700 transition-all flex flex-col justify-between gap-3 shadow-sm"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                    {item.type === 'LINK' ? 'External Link' : item.file_type}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">{item.file_size}</span>
                </div>

                <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug">{item.title}</h4>

                {item.assignment_title && (
                  <p className="text-[11px] text-indigo-300 font-medium truncate">
                    Linked: {item.assignment_title}
                  </p>
                )}

                {/* 5-Star Community Rating Component */}
                <div className="pt-1 flex items-center justify-between">
                  <StarRating
                    rating={item.avg_rating}
                    ratingsCount={item.ratings_count}
                    userRating={item.user_rating}
                    onRate={(score) => onRateResource(item.id, score)}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Avatar name={item.uploaded_by_name} src={item.uploaded_by_avatar} size="xs" />
                  <span className="text-[11px] text-slate-400 truncate">{item.uploaded_by_name}</span>
                </div>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold text-xs transition-colors"
                >
                  <span>{item.type === 'LINK' ? 'Open' : 'Get'}</span>
                  {item.type === 'LINK' ? <ExternalLink className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
