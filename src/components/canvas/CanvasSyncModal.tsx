import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { useCanvasSync } from '@/hooks/useCanvasSync';
import { RefreshCw, ExternalLink, Globe, Key, CheckCircle2, ShieldCheck, ShieldAlert } from 'lucide-react';

interface CanvasSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
}

export const CanvasSyncModal: React.FC<CanvasSyncModalProps> = ({ isOpen, onClose, onSyncComplete }) => {
  const { block, canModerate } = useAuth();
  const [domain, setDomain] = useState(block?.canvas_domain || 'canvas.instructure.com');
  const [token, setToken] = useState(block?.canvas_token || '');
  const { isSyncing, lastSynced, syncStatus, syncCanvas } = useCanvasSync();
  const [success, setSuccess] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canModerate) {
      setSyncError('Only Block Representatives and Block Assistants can run Canvas LMS synchronization.');
      return;
    }
    setSyncError(null);
    const res = await syncCanvas(domain, token);
    if (res.success) {
      setSuccess(true);
      onSyncComplete?.();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } else if (res.error) {
      setSyncError(res.error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-indigo-400" />
          <span>Canvas LMS Live Assignment Sync</span>
        </div>
      }
      description="Automatically import and update deadlines, course materials, and Canvas links."
    >
      <form onSubmit={handleSync} className="space-y-4">
        {!canModerate && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <p className="font-bold">Sync Access Restricted</p>
              <p className="text-[11px] text-amber-200/80 mt-0.5 leading-relaxed">
                Regular student accounts cannot initiate cohort Canvas sync. Please ask your Block Representative or Block Assistant to sync Canvas deadlines for the cohort.
              </p>
            </div>
          </div>
        )}

        {syncError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{syncError}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in zoom-in-95">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Successfully synced courses & deadlines from Canvas!</span>
          </div>
        )}

        <Input
          label="Canvas Instance Domain"
          placeholder="e.g. canvas.instructure.com or mycollege.instructure.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          icon={<Globe className="w-4 h-4" />}
          disabled={!canModerate}
          required
        />

        <div className="space-y-1">
          <Input
            label="Canvas API Access Token (Optional for demo)"
            type="password"
            placeholder="Paste token or leave blank to test sample sync"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            icon={<Key className="w-4 h-4" />}
            disabled={!canModerate}
          />
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
            <span>Find in Canvas: Account &gt; Settings &gt; Approved Integrations &gt; New Access Token</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5 text-slate-400">
          <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Non-Destructive Synchronization</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Existing completion checkmarks and peer-attached study materials are strictly preserved when updating deadlines.
          </p>
        </div>

        {lastSynced && (
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Last Synced:</span>
            <span className="font-mono text-slate-300">{new Date(lastSynced).toLocaleTimeString()}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {canModerate ? 'Cancel' : 'Close'}
          </Button>
          {canModerate && (
            <Button type="submit" variant="primary" size="sm" isLoading={isSyncing}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};
