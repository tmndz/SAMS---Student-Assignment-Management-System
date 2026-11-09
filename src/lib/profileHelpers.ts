import { supabase, isSupabaseConfigured } from './supabase';
import { UserProfile, NotificationPrefs, DEFAULT_NOTIFICATION_PREFS } from '@/types';

/** Merge DB notification_prefs with defaults to handle schema drift */
export function mergeNotifPrefs(raw: Partial<NotificationPrefs> | null | undefined): NotificationPrefs {
  return { ...DEFAULT_NOTIFICATION_PREFS, ...(raw || {}) };
}

/** Read a single user profile, generating an accessible URL for avatars */
export async function getProfileWithAvatar(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || !userId) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return null;

    const profile = data as UserProfile;
    profile.notification_prefs = mergeNotifPrefs(profile.notification_prefs);

    // Resolve avatar URL from public storage or fallback to signed URL
    if (profile.avatar_file_path) {
      try {
        const { data: pubData } = supabase.storage
          .from('avatars')
          .getPublicUrl(profile.avatar_file_path);
        if (pubData?.publicUrl) {
          profile.avatar_url = pubData.publicUrl;
        } else {
          const { data: signed } = await supabase.storage
            .from('avatars')
            .createSignedUrl(profile.avatar_file_path, 3600 * 24);
          if (signed?.signedUrl) {
            profile.avatar_url = signed.signedUrl;
          }
        }
      } catch {
        // Fall through to existing avatar_url (OAuth avatar, dicebear, etc.)
      }
    }

    return profile;
  } catch {
    return null;
  }
}

/** Update mutable profile fields */
export async function updateProfileFields(
  userId: string,
  updates: Partial<Pick<UserProfile,
    'full_name' | 'display_name' | 'bio' | 'year_level' | 'major' | 'notification_prefs' | 'current_task_id' | 'current_task_title'
  >>
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured) return {};
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);
  return { error: error?.message };
}

/** Helper to convert file to data URL for offline fallback */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Upload a profile picture to the avatars bucket and broadcast to classmates */
export async function uploadAvatar(userId: string, file: File): Promise<{ url: string; path: string } | { error: string }> {
  const MAX_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB
  if (file.size > MAX_SIZE_BYTES) {
    return { error: 'Avatar must be under 3 MB' };
  }
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) {
    return { error: 'Only JPEG, PNG, WebP, or GIF avatars are accepted' };
  }

  // Offline / mock fallback
  if (!isSupabaseConfigured) {
    try {
      const dataUrl = await readFileAsDataUrl(file);
      return { url: dataUrl, path: `local/${userId}` };
    } catch {
      return { error: 'Failed to read image file' };
    }
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${userId}/avatar.${ext}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      console.warn('Supabase storage upload error, falling back to data URL:', uploadError);
      const dataUrl = await readFileAsDataUrl(file);
      await supabase
        .from('profiles')
        .update({ avatar_url: dataUrl, updated_at: new Date().toISOString() })
        .eq('id', userId);
      return { url: dataUrl, path };
    }

    // Generate public and signed URLs
    const { data: pubData } = supabase.storage.from('avatars').getPublicUrl(path);
    const { data: signed } = await supabase.storage.from('avatars').createSignedUrl(path, 3600 * 24 * 30);
    const finalUrl = pubData?.publicUrl || signed?.signedUrl || '';

    // Persist BOTH the storage path and public avatar_url in the profile row so peers can load it
    await supabase
      .from('profiles')
      .update({
        avatar_file_path: path,
        avatar_url: finalUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    return { url: finalUrl, path };
  } catch (err: any) {
    return { error: err.message || 'Avatar upload failed' };
  }
}

/** Remove avatar from storage and clear profile references */
export async function deleteAvatar(userId: string, filePath: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured) return {};
  try {
    await supabase.storage.from('avatars').remove([filePath]);
    await supabase
      .from('profiles')
      .update({ avatar_file_path: null, avatar_url: null, updated_at: new Date().toISOString() })
      .eq('id', userId);
    return {};
  } catch (e: any) {
    return { error: e.message };
  }
}
