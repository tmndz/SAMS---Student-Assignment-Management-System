import React, { useState } from 'react';
import { PeerPresence } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Sparkles, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnlinePresenceBarProps {
  peers: PeerPresence[];
  onSelectPeer?: (peer: PeerPresence) => void;
  myFocusTitle?: string;
  onSetFocus?: () => void;
}

export const OnlinePresenceBar: React.FC<OnlinePresenceBarProps> = ({
  peers,
  onSelectPeer,
  myFocusTitle,
  onSetFocus,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const onlinePeers = peers.filter((p) => p.status === 'online' || p.status === 'focusing');

  return (
    <div className="flex items-center justify-between gap-3 py-2 px-3.5 rounded-xl bg-slate-900/60 border border-slate-800/60 backdrop-blur-sm text-xs">
      <div className="flex items-center gap-3 overflow-x-auto py-1 no-scrollbar">
        <div className="flex items-center gap-1.5 text-slate-400 font-semibold shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="hidden sm:inline">Cohort Active</span>
          <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
            {onlinePeers.length}
          </span>
        </div>

        {/* Minimal Presence Dots with Avatars */}
        <div className="flex items-center -space-x-1.5 sm:space-x-1">
          {onlinePeers.map((peer) => {
            const isFocusing = peer.status === 'focusing';
            return (
              <div
                key={peer.user_id}
                className="relative group shrink-0"
                onMouseEnter={() => setActiveTooltip(peer.user_id)}
                onMouseLeave={() => setActiveTooltip(null)}
                onClick={() => onSelectPeer?.(peer)}
              >
                <div className="cursor-pointer transition-transform hover:scale-110">
                  <Avatar
                    name={peer.user_name}
                    src={peer.user_avatar}
                    size="xs"
                    status={peer.status}
                  />
                </div>

                {/* Minimal Non-Intrusive Floating Micro-Card */}
                {activeTooltip === peer.user_id && (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-48 p-2.5 rounded-xl bg-slate-900 border border-slate-700 shadow-xl pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                    <div className="text-[11px] font-bold text-white truncate">{peer.user_name}</div>
                    {isFocusing && peer.current_task_title ? (
                      <div className="mt-1 flex items-start gap-1 text-[10px] text-amber-300">
                        <Sparkles className="w-3 h-3 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">Focusing: {peer.current_task_title}</span>
                      </div>
                    ) : (
                      <div className="mt-0.5 text-[10px] text-slate-400">Available online in block</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* User's own focus status badge */}
      <button
        onClick={onSetFocus}
        className={cn(
          'shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 max-w-[180px] sm:max-w-xs truncate',
          myFocusTitle
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-slate-200'
        )}
      >
        <Radio className={cn('w-3 h-3 shrink-0', myFocusTitle ? 'text-amber-400 animate-pulse' : 'text-slate-400')} />
        <span className="truncate">
          {myFocusTitle ? `Focus: ${myFocusTitle}` : 'Set task focus'}
        </span>
      </button>
    </div>
  );
};
