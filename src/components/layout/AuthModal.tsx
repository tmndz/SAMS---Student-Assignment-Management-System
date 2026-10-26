import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { LogIn, UserPlus, KeyRound, Mail, Sparkles, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultMode = 'signin' }) => {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setTab(defaultMode);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, defaultMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'signin') {
        const res = await signInWithEmail(email, password);
        if (res.error) {
          setError(res.error);
        } else {
          onClose();
        }
      } else {
        const res = await signUpWithEmail(email, password, name);
        if (res.error) {
          setError(res.error);
        } else {
          setSuccessMsg('Account created successfully! Logging you in...');
          setTimeout(() => {
            setSuccessMsg(null);
            onClose();
          }, 1200);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          {tab === 'signin' ? <LogIn className="w-5 h-5 text-indigo-400" /> : <UserPlus className="w-5 h-5 text-indigo-400" />}
          <span>{tab === 'signin' ? 'Sign in to BlockSync' : 'Create Student Account'}</span>
        </div>
      }
      description="Connect to your academic cohort with real-time Supabase Auth."
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
          <button type="button" onClick={() => { setTab('signin'); setError(null); }} className={`py-2 rounded-lg font-semibold transition-all ${tab === 'signin' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Sign In</button>
          <button type="button" onClick={() => { setTab('signup'); setError(null); }} className={`py-2 rounded-lg font-semibold transition-all ${tab === 'signup' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Sign Up</button>
        </div>

        {successMsg && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" /><span>{successMsg}</span></div>}
        {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === 'signup' && <Input label="Full Name" placeholder="e.g. Jordan Lee" value={name} onChange={(e) => setName(e.target.value)} required />}
          <Input label="Student Email" type="email" placeholder="student@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail className="w-4 h-4" />} required />
          <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} icon={<KeyRound className="w-4 h-4" />} required />
          <Button type="submit" variant="primary" className="w-full" isLoading={loading}>{tab === 'signin' ? 'Sign In' : 'Create Account'}</Button>
        </form>
      </div>
    </Modal>
  );
};
