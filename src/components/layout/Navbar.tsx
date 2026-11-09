import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { AppNotification, NavigationTab } from '@/types';
import {
  Layers,
  Plus,
  MessageSquare,
  Copy,
  Check,
  RefreshCw,
  LogIn,
  LogOut,
  User,
  ShieldAlert,
} from 'lucide-react';

interface NavbarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenNewAssignment: () => void;
  onOpenJoinBlock: () => void;
  onOpenChat: () => void;
  onOpenCanvasSync: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  unreadCount?: number;
  notifications: AppNotification[];
  notifUnreadCount: number;
  onMarkAllNotifRead: () => void;
  onMarkNotifRead: (id: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewAssignment,
  onOpenJoinBlock,
  onOpenChat,
  onOpenCanvasSync,
  onOpenAuth,
  onOpenProfile,
  unreadCount = 0,
  notifications,
  notifUnreadCount,
  onMarkAllNotifRead,
  onMarkNotifRead,
}) => {
  const { user, block, isAuthenticated, signOut, canModerate } = useAuth();
  const [copied, setCopied] = useState(false);

  const copyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!block?.join_code) return;
    navigator.clipboard.writeText(block.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const roleBadge = user?.role === 'rep'
    ? { text: 'Rep', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' }
    : user?.role === 'block_assistant'
    ? { text: 'Asst', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' }
    : null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand & Cohort Badge */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Layers className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-white hidden sm:inline">
              Block<span className="text-indigo-400">Sync</span>
            </span>
          </div>

          {block && (
            <div
              onClick={onOpenJoinBlock}
              className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all text-xs"
            >
              <div className="flex items-center gap-1.5 font-bold text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="truncate max-w-[120px] sm:max-w-none">{block.name}</span>
              </div>
              <button
                onClick={copyCode}
                title="Copy Cohort Join Code"
                className="text-[10px] text-slate-400 hover:text-indigo-300 font-mono px-1 py-0.5 rounded bg-slate-800 flex items-center gap-0.5"
              >
                {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                <span>{block.join_code}</span>
              </button>
            </div>
          )}
        </div>

        {/* Center Tabs */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-semibold">
          {(['dashboard', 'assignments', 'resources', 'classmates'] as const).map((tab) => {
            const labels: Record<NavigationTab, string> = {
              dashboard: 'Dashboard',
              assignments: 'Assignments',
              resources: 'Study Hub',
              classmates: 'Classmates',
            };
            return (
              <button
                key={tab}
                onClick={() => onSelectTab(tab)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  currentTab === tab
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Canvas LMS Sync Trigger — Restricted to Reps & Block Assistants */}
          {canModerate && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenCanvasSync}
              title="Canvas LMS Sync"
              className="hidden sm:inline-flex"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1 text-indigo-400" />
              <span className="text-xs">Canvas Sync</span>
            </Button>
          )}

          {/* Cross-Platform Notification Bell */}
          <NotificationBell
            notifications={notifications}
            unreadCount={notifUnreadCount}
            onMarkAllRead={onMarkAllNotifRead}
            onMarkRead={onMarkNotifRead}
          />

          {/* P2P / Channel Chat */}
          <Button
            size="sm"
            variant="outline"
            className="relative"
            onClick={onOpenChat}
            title="Peer Chat & Advice"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline ml-1 text-xs">Chat</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </Button>

          <Button size="sm" variant="primary" onClick={onOpenNewAssignment}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">Add Task</span>
          </Button>

          {/* User Auth Profile */}
          {isAuthenticated && user ? (
            <div className="relative group">
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 p-1 pl-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
              >
                <div className="flex flex-col items-start leading-none hidden lg:flex">
                  <span className="text-[11px] font-medium text-slate-300 truncate max-w-[90px]">
                    {user.display_name || user.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'User'}
                  </span>
                  {roleBadge && (
                    <span className={`text-[9px] font-bold px-1 rounded border mt-0.5 ${roleBadge.color}`}>
                      {roleBadge.text}
                    </span>
                  )}
                </div>
                <Avatar
                  name={user.full_name || user.email || 'U'}
                  src={user.avatar_url}
                  size="xs"
                  status="online"
                />
              </button>

              <div className="absolute right-0 top-full mt-2 w-52 p-2 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl hidden group-hover:block z-50 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1.5 border-b border-slate-800/80 mb-1">
                  <p className="text-xs font-bold text-white truncate">{user.full_name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  {roleBadge && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-indigo-300 font-semibold">
                      <ShieldAlert className="w-3 h-3" />
                      <span>{user.role === 'rep' ? 'Cohort Representative' : 'Block Assistant'}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={onOpenProfile}
                  className="w-full text-left flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-xs text-slate-300 hover:text-white"
                >
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Profile & Settings</span>
                </button>
                <button
                  onClick={() => signOut()}
                  className="w-full text-left flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-xs text-rose-400"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="secondary" onClick={onOpenAuth}>
              <LogIn className="w-3.5 h-3.5 mr-1" />
              <span className="text-xs">Sign In</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
