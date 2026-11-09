import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Clock, BookOpen, Users, Sparkles, RefreshCw, Info } from 'lucide-react';
import { AppNotification } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface NotificationBellProps {
  notifications: AppNotification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
}

const NOTIF_ICONS: Record<AppNotification['type'], React.ReactNode> = {
  deadline_24h: <Clock className="w-4 h-4 text-amber-400" />,
  deadline_1h: <Clock className="w-4 h-4 text-rose-400" />,
  deadline_missed: <Clock className="w-4 h-4 text-rose-500" />,
  new_assignment: <BookOpen className="w-4 h-4 text-indigo-400" />,
  resource_uploaded: <BookOpen className="w-4 h-4 text-sky-400" />,
  peer_completed: <Users className="w-4 h-4 text-emerald-400" />,
  motivational: <Sparkles className="w-4 h-4 text-purple-400" />,
  canvas_sync_update: <RefreshCw className="w-4 h-4 text-teal-400" />,
};

export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  unreadCount,
  onMarkAllRead,
  onMarkRead,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen((p) => !p)}
        className="relative p-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <span className="text-sm font-bold text-white">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => { onMarkAllRead(); setIsOpen(false); }}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" />Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2 text-slate-500">
                <Info className="w-8 h-8 opacity-40" />
                <p className="text-xs">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => { if (!n.is_read) onMarkRead(n.id); }}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-slate-800/60 transition-colors ${!n.is_read ? 'bg-indigo-950/20' : ''}`}
                >
                  <div className="mt-0.5 shrink-0">
                    {NOTIF_ICONS[n.type] ?? <Bell className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${!n.is_read ? 'text-white' : 'text-slate-300'}`}>
                      {n.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.is_read && (
                    <div className="shrink-0 mt-1.5 w-2 h-2 rounded-full bg-indigo-500" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
