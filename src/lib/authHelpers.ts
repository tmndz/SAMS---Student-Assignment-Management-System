import { supabase, isSupabaseConfigured } from './supabase';
import { UserProfile, Block } from '@/types';
import { INITIAL_USER } from './mockData';

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error || !data) return null;
    return data as UserProfile;
  } catch (err) {
    return null;
  }
}

export async function upsertProfile(profile: Partial<UserProfile> & { id: string; email: string }): Promise<UserProfile> {
  if (!isSupabaseConfigured) return { ...INITIAL_USER, ...profile } as UserProfile;
  const payload = {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name || profile.email.split('@')[0],
    avatar_url: profile.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.id}`,
    block_id: profile.block_id || null,
    role: profile.role || 'student',
  };
  const { data } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' }).select().single();
  return (data || payload) as UserProfile;
}

export async function fetchBlockById(blockId: string): Promise<Block | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data } = await supabase.from('blocks').select('*').eq('id', blockId).maybeSingle();
    return data as Block | null;
  } catch {
    return null;
  }
}

export async function fetchBlockByCode(code: string): Promise<Block | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data } = await supabase.from('blocks').select('*').ilike('join_code', code.trim()).maybeSingle();
    return data as Block | null;
  } catch {
    return null;
  }
}

export async function insertBlock(block: Block): Promise<Block> {
  if (!isSupabaseConfigured) return block;
  const { data } = await supabase.from('blocks').insert([block]).select().single();
  return (data || block) as Block;
}
