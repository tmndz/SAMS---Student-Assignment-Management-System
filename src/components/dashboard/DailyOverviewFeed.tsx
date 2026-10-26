import React from 'react';
import { ActivityFeedItem } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { CheckCircle2, FileUp, MessageSquare, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DailyOverviewFeedProps {
  activities: ActivityFeedItem[];
  onSelectActivity?: (item: ActivityFeedItem) => void;
}

export const DailyOverviewFeed: React.FC<DailyOverviewFeedProps> = ({
  activities,
  onSelectActivity,
}) => {
  const getIcon = (type: ActivityFeedItem['type']) => {
    switch (type) {
      case 'completion':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'upload':
        return <FileUp className="w-3.5 h-3.5 text-indigo-400" />;
      case 'advice_asked':
        return <MessageSquare className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getActionText = (item: ActivityFeedItem) => {
    switch (item.type) {
      case 'completion':
        return 'completed';
      case 'upload':
        return 'shared reviewer for';
      case 'advice_asked':
        return 'requested advice for';
      default:
        return 'updated';
    }
  };

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 sm:p-5">
      <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-800/60">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Live Block Activity
        </h3>
        <span className="text-[11px] text-slate-400">Past 24 hours</span>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs space-y-1">
          <p className="text-slate-400 font-medium">No recent cohort activity</p>
          <p className="text-[11px] text-slate-600">Be the first to complete a task or share notes!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.slice(0, 6).map((item) => {
            let timeAgo = 'recently';
            try {
              timeAgo = formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });
            } catch {
              // fallback
            }

            return (
              <div
                key={item.id}
                onClick={() => onSelectActivity?.(item)}
                className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/40 transition-colors cursor-pointer"
              >
                <div className="relative shrink-0 mt-0.5">
                  <Avatar name={item.actor_name} src={item.actor_avatar} size="xs" />
                  <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-slate-900 border border-slate-800">
                    {getIcon(item.type)}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-xs text-slate-300 leading-snug">
                    <span className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      {item.actor_name}
                    </span>{' '}
                    <span className="text-slate-400">{getActionText(item)}</span>{' '}
                    <span className="font-medium text-slate-200 truncate block sm:inline">
                      "{item.target_title}"
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                    <span>{timeAgo}</span>
                    {item.badge_text && (
                      <>
                        <span>•</span>
                        <span className="text-slate-400 font-medium">{item.badge_text}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
