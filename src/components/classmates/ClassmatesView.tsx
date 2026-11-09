import React, { useState, useMemo } from 'react';
import { UserProfile, PeerPresence, Block } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import {
  Users,
  Shield,
  Crown,
  GraduationCap,
  MessageSquare,
  Search,
  Sparkles,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ClassmatesViewProps {
  block: Block;
  currentUserId: string;
  isCurrentUserRep: boolean;
  classmates: UserProfile[];
  peersPresence: PeerPresence[];
  onUpdateRole: (userId: string, newRole: 'student' | 'block_assistant') => Promise<{ success: boolean; error?: string }>;
  onStartDirectChat: (classmate: UserProfile) => void;
}

export const ClassmatesView: React.FC<ClassmatesViewProps> = ({
  block,
  currentUserId,
  isCurrentUserRep,
  classmates,
  peersPresence,
  onUpdateRole,
  onStartDirectChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'rep' | 'block_assistant' | 'student'>('all');
  const [presenceFilter, setPresenceFilter] = useState<'all' | 'online'>('all');
  const [copiedCode, setCopiedCode] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Map presence for quick lookup
  const presenceMap = useMemo(() => {
    const map = new Map<string, PeerPresence>();
    peersPresence.forEach((p) => map.set(p.user_id, p));
    return map;
  }, [peersPresence]);

  const copyJoinCode = () => {
    navigator.clipboard.writeText(block.join_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleRoleChange = async (targetUser: UserProfile, newRole: 'student' | 'block_assistant') => {
    setUpdatingUserId(targetUser.id);
    const result = await onUpdateRole(targetUser.id, newRole);
    setUpdatingUserId(null);

    if (result.success) {
      showFeedback(
        `${targetUser.full_name} is now ${newRole === 'block_assistant' ? 'a Block Assistant' : 'a Student'}.`,
        'success'
      );
    } else {
      showFeedback(result.error || 'Failed to update role permissions.', 'error');
    }
  };

  // Filtered members list
  const filteredClassmates = useMemo(() => {
    return classmates.filter((member) => {
      // Role filter
      if (roleFilter !== 'all' && member.role !== roleFilter) return false;

      // Online status filter
      if (presenceFilter === 'online') {
        const pres = presenceMap.get(member.id);
        const isOnline = pres?.status === 'online' || pres?.status === 'focusing' || member.id === currentUserId;
        if (!isOnline) return false;
      }

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        member.full_name.toLowerCase().includes(q) ||
        (member.display_name && member.display_name.toLowerCase().includes(q)) ||
        member.email.toLowerCase().includes(q) ||
        (member.major && member.major.toLowerCase().includes(q)) ||
        (member.bio && member.bio.toLowerCase().includes(q))
      );
    });
  }, [classmates, roleFilter, presenceFilter, searchQuery, presenceMap, currentUserId]);

  const stats = useMemo(() => {
    const reps = classmates.filter((m) => m.role === 'rep').length;
    const assistants = classmates.filter((m) => m.role === 'block_assistant').length;
    const students = classmates.filter((m) => m.role === 'student').length;
    const online = classmates.filter((m) => {
      const p = presenceMap.get(m.id);
      return p?.status === 'online' || p?.status === 'focusing' || m.id === currentUserId;
    }).length;
    return { total: classmates.length, reps, assistants, students, online };
  }, [classmates, presenceMap, currentUserId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Cohort Header & Quick Stats */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
                {block.name} Cohort
              </span>
              <span className="text-xs text-slate-400">{block.institution}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-400" />
              <span>Classmates & Permission Directory</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Connect with classmates, reach out for assignment advice, and view cohort responsibilities.
            </p>
          </div>

          {/* Join code pill */}
          <div className="flex items-center gap-2 self-start md:self-auto bg-slate-950/80 border border-slate-800 p-2 rounded-xl text-xs">
            <span className="text-slate-400">Join Code:</span>
            <span className="font-mono font-bold text-white tracking-wider">{block.join_code}</span>
            <button
              onClick={copyJoinCode}
              title="Copy Join Code"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Total Classmates</span>
            </div>
            <div className="text-xl font-bold text-white mt-1">{stats.total}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Active Now</span>
            </div>
            <div className="text-xl font-bold text-emerald-400 mt-1">{stats.online}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Cohort Reps</span>
            </div>
            <div className="text-xl font-bold text-amber-400 mt-1">{stats.reps}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>Block Assistants</span>
            </div>
            <div className="text-xl font-bold text-indigo-300 mt-1">{stats.assistants}</div>
          </div>
        </div>
      </div>

      {/* Role Permissions Callout for Reps */}
      {isCurrentUserRep && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-start gap-3">
          <Crown className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-amber-300">Cohort Representative Controls</h4>
            <p className="text-slate-300 mt-0.5 leading-relaxed">
              As a Block Rep, you have authority to appoint and manage <strong>Block Assistants</strong>.
              Block Assistants can moderate chat conversations, remove spam or inappropriate study notes,
              and maintain course assignments across the block.
            </p>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-in slide-in-from-top duration-200 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search classmates by name, major, or bio..."
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Role Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
          {(
            [
              { id: 'all', label: 'All', count: stats.total },
              { id: 'rep', label: 'Reps', count: stats.reps },
              { id: 'block_assistant', label: 'Assistants', count: stats.assistants },
              { id: 'student', label: 'Students', count: stats.students },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                roleFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Presence Toggle */}
        <div className="flex items-center gap-1 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-3">
          <button
            onClick={() => setPresenceFilter((p) => (p === 'all' ? 'online' : 'all'))}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              presenceFilter === 'online'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                presenceFilter === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span>Online Only</span>
          </button>
        </div>
      </div>

      {/* Classmates Grid */}
      {filteredClassmates.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No classmates match your filters</p>
          <p className="text-xs text-slate-500">Try clearing the search query or changing role filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClassmates.map((member) => {
            const isMe = member.id === currentUserId;
            const presence = presenceMap.get(member.id);
            const isOnline = presence?.status === 'online' || presence?.status === 'focusing' || isMe;
            const isFocusing = presence?.status === 'focusing';

            return (
              <div
                key={member.id}
                className={`p-4 rounded-2xl bg-slate-900 border transition-all duration-150 flex flex-col justify-between ${
                  isMe ? 'border-indigo-500/40 shadow-lg shadow-indigo-600/10' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Card Header: Avatar & Role Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative">
                        <Avatar
                          name={member.full_name || member.email}
                          src={member.avatar_url}
                          size="md"
                          status={isFocusing ? 'focusing' : isOnline ? 'online' : 'offline'}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-sm text-white truncate">
                            {member.full_name}
                          </h3>
                          {isMe && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                              You
                            </span>
                          )}
                        </div>
                        {member.display_name && member.display_name !== member.full_name && (
                          <p className="text-[11px] text-slate-400 truncate">@{member.display_name}</p>
                        )}
                        <p className="text-[11px] text-slate-500 truncate">{member.email}</p>
                      </div>
                    </div>

                    {/* Role Badge */}
                    <div className="shrink-0">
                      {member.role === 'rep' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-400" />
                          <span>Rep</span>
                        </span>
                      )}
                      {member.role === 'block_assistant' && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold flex items-center gap-1">
                          <Shield className="w-3 h-3 text-indigo-400" />
                          <span>Assistant</span>
                        </span>
                      )}
                      {member.role === 'student' && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/80 text-[10px] font-medium flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" />
                          <span>Student</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Academic Info */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap mb-2">
                    {member.major && (
                      <span className="flex items-center gap-1 text-slate-300">
                        <BookOpen className="w-3 h-3 text-indigo-400" />
                        <span>{member.major}</span>
                      </span>
                    )}
                    {member.year_level && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300 font-medium">
                        {member.year_level.toUpperCase()} YEAR
                      </span>
                    )}
                  </div>

                  {/* Bio */}
                  {member.bio && (
                    <p className="text-xs text-slate-300 italic line-clamp-2 mb-3 bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
                      "{member.bio}"
                    </p>
                  )}

                  {/* Currently Focusing Pill */}
                  {isFocusing && presence?.current_task_title && (
                    <div className="mb-3 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-1.5 text-xs text-amber-300">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">Focusing: {presence.current_task_title}</span>
                    </div>
                  )}
                </div>

                {/* Footer Controls: Role adjustment (Rep only) + Message button */}
                <div className="pt-3 border-t border-slate-800/80 mt-2 space-y-2">
                  {/* Role Permissions Dropdown / Toggle (Visible ONLY to Block Reps for OTHER classmates) */}
                  {isCurrentUserRep && !isMe && member.role !== 'rep' && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-indigo-400" />
                        <span>Role:</span>
                      </span>
                      <select
                        value={member.role}
                        disabled={updatingUserId === member.id}
                        onChange={(e) =>
                          handleRoleChange(member, e.target.value as 'student' | 'block_assistant')
                        }
                        className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50"
                      >
                        <option value="student">Student</option>
                        <option value="block_assistant">🛡️ Block Assistant</option>
                      </select>
                    </div>
                  )}

                  {/* Message Action */}
                  {!isMe && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => onStartDirectChat(member)}
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                      <span>Message / Ask Advice</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
