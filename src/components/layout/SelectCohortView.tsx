import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Users, Plus, Hash, Building2, LogOut } from 'lucide-react';

interface SelectCohortViewProps {
  userName: string;
  onJoinCode: (code: string) => Promise<boolean>;
  onCreateBlock: (name: string, institution: string) => Promise<any>;
  onSignOut: () => void;
}

export const SelectCohortView: React.FC<SelectCohortViewProps> = ({
  userName,
  onJoinCode,
  onCreateBlock,
  onSignOut,
}) => {
  const [mode, setMode] = useState<'join' | 'create'>('join');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const ok = await onJoinCode(code.trim());
      if (!ok) setError('Block code not found. Please double-check with your classmate or create a new block.');
    } catch (err: any) {
      setError(err?.message || 'Failed to join block');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await onCreateBlock(name.trim(), institution.trim() || 'Academic Cohort');
    } catch (err: any) {
      setError(err?.message || 'Failed to create block');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Users className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-white">Join an Academic Block</span>
          </div>
          <button onClick={onSignOut} className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white">Welcome, {userName}!</h2>
          <p className="text-xs text-slate-400">
            To view shared assignments, reviewers, and live classmates, connect to your cohort.
          </p>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => { setMode('join'); setError(null); }}
            className={`py-2 rounded-lg font-semibold transition-all ${mode === 'join' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
          >
            Join with Code
          </button>
          <button
            type="button"
            onClick={() => { setMode('create'); setError(null); }}
            className={`py-2 rounded-lg font-semibold transition-all ${mode === 'create' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
          >
            Create New Block
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs leading-relaxed">
            {error}
          </div>
        )}

        {mode === 'join' ? (
          <form onSubmit={handleJoin} className="space-y-4">
            <Input
              label="Block Join Code"
              placeholder="e.g. CS2A-SYNC"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              icon={<Hash className="w-4 h-4" />}
              required
            />
            <p className="text-[11px] text-slate-500">
              Ask your class representative or classmate for your section's join code.
            </p>
            <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
              Connect to Block
            </Button>
          </form>
        ) : (
          <form onSubmit={handleCreate} className="space-y-3.5">
            <Input
              label="Block / Section Name *"
              placeholder="e.g. CS-2A or Grade 12 STEM-B"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<Users className="w-4 h-4" />}
              required
            />
            <Input
              label="School / Institution Name"
              placeholder="e.g. Life Academy International"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              icon={<Building2 className="w-4 h-4" />}
            />
            <p className="text-[11px] text-slate-500">
              You will become the Block Representative and receive a shareable join code for your peers.
            </p>
            <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
              Create Block & Continue
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
