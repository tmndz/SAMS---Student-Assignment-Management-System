import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { uploadAvatar, deleteAvatar } from '@/lib/profileHelpers';
import { NotificationPrefs, DEFAULT_NOTIFICATION_PREFS } from '@/types';
import { Camera, Trash2, Save, Bell, User, BookOpen } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    full_name: user?.full_name ?? '',
    display_name: user?.display_name ?? '',
    bio: user?.bio ?? '',
    year_level: user?.year_level ?? '',
    major: user?.major ?? '',
  });

  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    ...DEFAULT_NOTIFICATION_PREFS,
    ...(user?.notification_prefs ?? {}),
  });

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name ?? '',
        display_name: user.display_name ?? '',
        bio: user.bio ?? '',
        year_level: user.year_level ?? '',
        major: user.major ?? '',
      });
      setNotifPrefs({
        ...DEFAULT_NOTIFICATION_PREFS,
        ...(user.notification_prefs ?? {}),
      });
    }
  }, [user]);

  if (!user) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg('');
    await updateProfile({
      full_name: form.full_name,
      display_name: form.display_name || undefined,
      bio: form.bio || undefined,
      year_level: (form.year_level as any) || undefined,
      major: form.major || undefined,
      notification_prefs: notifPrefs,
    });
    await refreshUser();
    setSuccessMsg('Profile saved successfully!');
    setIsSaving(false);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError('');
    setIsUploadingAvatar(true);
    const result = await uploadAvatar(user.id, file);
    setIsUploadingAvatar(false);
    if ('error' in result) {
      setAvatarError(result.error);
    } else {
      await refreshUser();
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user.avatar_file_path) return;
    await deleteAvatar(user.id, user.avatar_file_path);
    await refreshUser();
  };

  const roleBadge: Record<string, string> = {
    student: 'bg-slate-700 text-slate-300',
    block_assistant: 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30',
    rep: 'bg-amber-600/20 text-amber-300 border border-amber-500/30',
  };
  const roleLabel: Record<string, string> = {
    student: 'Student',
    block_assistant: 'Block Assistant',
    rep: 'Block Rep',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="My Profile & Settings" maxWidth="lg">
      <div className="space-y-6">
        {/* Avatar section */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar
              name={user.full_name || user.email}
              src={user.avatar_url}
              size="lg"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-indigo-600 hover:bg-indigo-500 border-2 border-slate-900 flex items-center justify-center transition-colors"
              title="Change avatar"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-white truncate">{user.full_name}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleBadge[user.role] || roleBadge.student}`}>
                {roleLabel[user.role] || 'Student'}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
            {user.avatar_file_path && (
              <button
                onClick={handleDeleteAvatar}
                className="mt-1 text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove custom avatar</span>
              </button>
            )}
            {avatarError && <p className="text-xs text-rose-400 mt-1">{avatarError}</p>}
          </div>
        </div>

        {/* Basic info */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span>Basic Info</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Full Name</label>
              <input
                value={form.full_name}
                onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Display Name (Nickname)</label>
              <input
                value={form.display_name}
                onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
                placeholder="Optional"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 font-medium block mb-1">Bio / Status</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              rows={2}
              placeholder="e.g. Preparing for finals, ask me about CS 220!"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* Academic info */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Academic Info</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Year Level</label>
              <select
                value={form.year_level}
                onChange={(e) => setForm((p) => ({ ...p, year_level: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select year</option>
                {['1st', '2nd', '3rd', '4th', '5th', 'grad'].map((y) => (
                  <option key={y} value={y}>{y.charAt(0).toUpperCase() + y.slice(1)} Year</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Major / Degree</label>
              <input
                value={form.major}
                onChange={(e) => setForm((p) => ({ ...p, major: e.target.value }))}
                placeholder="e.g. BS Computer Science"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Notification preferences */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-indigo-400" />
            <span>Notification Preferences</span>
          </h4>
          <div className="space-y-2">
            {(Object.entries(notifPrefs) as [keyof NotificationPrefs, boolean][]).map(([key, val]) => {
              const labels: Record<keyof NotificationPrefs, string> = {
                deadline_24h: '24-hour deadline reminders',
                deadline_1h: '1-hour urgent deadline alerts',
                motivational: 'Daily motivational check-ins',
                peer_completed: 'When a classmate completes the same assignment',
                new_assignment: 'When a new assignment is added to your block',
              };
              return (
                <div
                  key={key}
                  onClick={() => setNotifPrefs((p) => ({ ...p, [key]: !val }))}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors"
                >
                  <span className="text-xs text-slate-300">{labels[key]}</span>
                  <div
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      val ? 'bg-indigo-600' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        val ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          {successMsg ? (
            <span className="text-xs text-emerald-400 font-medium">{successMsg}</span>
          ) : (
            <span />
          )}
          <Button variant="primary" size="md" onClick={handleSave} isLoading={isSaving}>
            <Save className="w-4 h-4 mr-1.5" />
            <span>Save Changes</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
