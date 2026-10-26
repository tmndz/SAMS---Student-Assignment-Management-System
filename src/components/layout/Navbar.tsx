import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import {
  Layers,
  Plus,
  MessageSquare,
  Users,
  Copy,
  Check,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'dashboard' | 'assignments' | 'resources';
  onSelectTab: (tab: 'dashboard' | 'assignments' | 'resources') => void;
  onOpenNewAssignment: () => void;
  onOpenJoinBlock: () => void;
  onOpenAdviceInbox: () => void;
  adviceCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewAssignment,
  onOpenJoinBlock,
  onOpenAdviceInbox,
  adviceCount,
}) => {
  const { user, block, allBlocks, switchBlock, switchUser } = useAuth();
  const [copied, setCopied] = React.useState(false);

  const copyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(block.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const demoUsers = [
    { name: 'Alex Rivera (You)', role: 'student' as const, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    { name: 'Sarah Chen (Rep)', role: 'rep' as const, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
    { name: 'Marcus Vance', role: 'student' as const, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Block Badge */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Layers className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-white hidden sm:inline">
              Block<span className="text-indigo-400">Sync</span>
            </span>
          </div>

          <div
            onClick={onOpenJoinBlock}
            className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all text-xs"
          >
            <div className="flex items-center gap-1.5 font-bold text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{block.name}</span>
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
        </div>

        {/* Center Tabs */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs font-semibold">
          {(['dashboard', 'assignments', 'resources'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => onSelectTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg capitalize transition-all ${
                currentTab === tab ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'resources' ? 'Reviewer Hub' : tab}
            </button>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <Button size="sm" variant="outline" className="relative" onClick={onOpenAdviceInbox} title="Advice">
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline ml-1 text-xs">Advice</span>
            {adviceCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-bold">
                {adviceCount}
              </span>
            )}
          </Button>

          <Button size="sm" variant="primary" onClick={onOpenNewAssignment}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">New Task</span>
          </Button>

          {/* User Persona Toggle */}
          <div className="relative group">
            <div className="flex items-center gap-2 p-1 pl-2 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer">
              <span className="text-[11px] font-medium text-slate-300 hidden lg:inline truncate max-w-[90px]">
                {user.full_name.split(' ')[0]}
              </span>
              <Avatar name={user.full_name} src={user.avatar_url} size="xs" status="online" />
            </div>

            <div className="absolute right-0 top-full mt-2 w-52 p-2 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl hidden group-hover:block animate-in fade-in zoom-in-95">
              <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">Switch Persona</div>
              {demoUsers.map((u) => (
                <button
                  key={u.name}
                  onClick={() => switchUser({ full_name: u.name, avatar_url: u.avatar, role: u.role })}
                  className="w-full text-left flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-xs text-slate-200"
                >
                  <Avatar name={u.name} src={u.avatar} size="xs" />
                  <span className="truncate">{u.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
