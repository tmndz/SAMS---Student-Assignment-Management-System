import { supabase, isSupabaseConfigured } from './supabase';
import { UserProfile, NotificationPrefs, DEFAULT_NOTIFICATION_PREFS } from '@/types';

/** Merge DB notification_prefs with defaults to handle schema drift */
export function mergeNotifPrefs(raw: Partial<NotificationPrefs> | null | undefined): NotificationPrefs {
  return { ...DEFAULT_NOTIFICATION_PREFS, ...(raw || {}) };
}

/** Read a single user profile, generating a signed URL for private avatars */
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

    // Generate a 1-hour signed URL for private avatars bucket
    if (profile.avatar_file_path) {
      try {
        const { data: signed } = await supabase.storage
          .from('avatars')
          .createSignedUrl(profile.avatar_file_path, 3600);
        if (signed?.signedUrl) {
          profile.avatar_url = signed.signedUrl;
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
    'full_name' | 'display_name' | 'bio' | 'year_level' | 'major' | 'notification_prefs'
  >>
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured) return {};
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);
  return { error: error?.message };
}

/** Upload a profile picture to the private avatars bucket */
export async function uploadAvatar(userId: string, file: File): Promise<{ url: string; path: string } | { error: string }> {
  if (!isSupabaseConfigured) return { error: 'Supabase not configured' };

  const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
  if (file.size > MAX_SIZE_BYTES) {
    return { error: 'Avatar must be under 2 MB' };
  }
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) {
    return { error: 'Only JPEG, PNG, WebP, or GIF avatars are accepted' };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  // Persist the storage path in the profile row
  await supabase
    .from('profiles')
    .update({ avatar_file_path: path, updated_at: new Date().toISOString() })
    .eq('id', userId);

  // Return a fresh 1-hour signed URL
  const { data: signed } = await supabase.storage
    .from('avatars')
    .createSignedUrl(path, 3600);

  return { url: signed?.signedUrl ?? '', path };
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
