import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Users, Plus, Hash } from 'lucide-react';

interface JoinBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinCode: (code: string) => boolean | Promise<boolean>;
  onCreateBlock: (name: string, institution: string) => void;
}

export const JoinBlockModal: React.FC<JoinBlockModalProps> = ({
  isOpen,
  onClose,
  onJoinCode,
  onCreateBlock,
}) => {
  const [tab, setTab] = useState<'join' | 'create'>('join');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const success = await onJoinCode(code);
    if (success) {
      setCode('');
      onClose();
    } else {
      setError('Block code not found. Please verify the code with your classmate or section rep.');
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateBlock(name.trim(), institution.trim() || 'University Cohort');
    setName('');
    setInstitution('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-400" />
          <span>Academic Block Grouping</span>
        </div>
      }
      description="Connect to your section or department cohort."
    >
      <div className="space-y-4">
        {/* Switch tab */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => { setTab('join'); setError(null); }}
            className={`py-2 rounded-lg font-semibold transition-all ${tab === 'join' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
          >
            Join with Code
          </button>
          <button
            type="button"
            onClick={() => { setTab('create'); setError(null); }}
            className={`py-2 rounded-lg font-semibold transition-all ${tab === 'create' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
          >
            Create New Block
          </button>
        </div>

        {tab === 'join' ? (
          <form onSubmit={handleJoin} className="space-y-3.5">
            <Input
              label="Block Join Code"
              placeholder="e.g. CS2A-1234"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              error={error || undefined}
              icon={<Hash className="w-4 h-4" />}
              required
            />
            <p className="text-[11px] text-slate-500">
              Enter the unique join code shared by your class representative or peer.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Join Block
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCreate} className="space-y-3.5">
            <Input
              label="Block / Cohort Name *"
              placeholder="e.g. CS-2A or ECE-3B"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Institution / Department"
              placeholder="e.g. Faculty of Computing"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Create & Become Rep
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
