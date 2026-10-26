import { supabase, isSupabaseConfigured } from './supabase';
import { UserProfile, Block } from '@/types';
import { generateUUID } from './utils';

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || !userId) return null;
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error || !data) return null;
    return data as UserProfile;
  } catch {
    return null;
  }
}

export async function upsertProfile(profile: Partial<UserProfile> & { id: string; email: string }): Promise<UserProfile> {
  const payload: UserProfile = {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name || profile.email.split('@')[0],
    avatar_url: profile.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.id}`,
    block_id: profile.block_id || null,
    role: profile.role || 'student',
  };
  if (!isSupabaseConfigured) return payload;
  try {
    const { data } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' }).select().single();
    return (data || payload) as UserProfile;
  } catch {
    return payload;
  }
}

export async function fetchBlockById(blockId: string): Promise<Block | null> {
  if (!isSupabaseConfigured || !blockId) return null;
  try {
    const { data } = await supabase.from('blocks').select('*').eq('id', blockId).maybeSingle();
    return (data || null) as Block | null;
  } catch {
    return null;
  }
}

export async function fetchBlockByCode(code: string): Promise<Block | null> {
  if (!isSupabaseConfigured || !code) return null;
  try {
    const { data } = await supabase.from('blocks').select('*').ilike('join_code', code.trim()).maybeSingle();
    return (data || null) as Block | null;
  } catch {
    return null;
  }
}

export async function insertBlock(block: Block): Promise<Block> {
  const blockUuid = block.id && !block.id.startsWith('blk_') ? block.id : generateUUID();
  const dbPayload = {
    id: blockUuid,
    name: block.name,
    join_code: block.join_code,
    institution: block.institution,
    canvas_domain: block.canvas_domain || null,
    canvas_token: block.canvas_token || null,
  };
  if (!isSupabaseConfigured) return { ...block, id: blockUuid };
  try {
    const { data, error } = await supabase.from('blocks').insert([dbPayload]).select().single();
    if (error) {
      console.warn('insertBlock error:', error);
      return { ...block, id: blockUuid };
    }
    return (data || { ...block, id: blockUuid }) as Block;
  } catch {
    return { ...block, id: blockUuid };
  }
}

export async function fetchBlockMembers(blockId: string): Promise<UserProfile[]> {
  if (!isSupabaseConfigured || !blockId) return [];
  try {
    const { data } = await supabase.from('profiles').select('*').eq('block_id', blockId);
    return (data || []) as UserProfile[];
  } catch {
    return [];
  }
}
