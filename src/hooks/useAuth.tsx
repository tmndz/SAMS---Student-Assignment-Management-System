import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { UserProfile, Block } from '@/types';
import { fetchProfile, upsertProfile, fetchBlockById, fetchBlockByCode, insertBlock } from '@/lib/authHelpers';
import { generateUUID } from '@/lib/utils';

interface AuthContextType {
  user: UserProfile | null;
  block: Block | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  joinBlockByCode: (code: string) => Promise<boolean>;
  createBlock: (name: string, institution: string, canvasDomain?: string, canvasToken?: string) => Promise<Block>;
  updateBlockCanvasCredentials: (domain: string, token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [block, setBlock] = useState<Block | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsAuthenticated(true);
        syncUserSession(session.user);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        syncUserSession(session.user);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setBlock(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncUserSession = async (authUser: any) => {
    try {
      let p = await fetchProfile(authUser.id);
      if (!p) {
        p = await upsertProfile({
          id: authUser.id,
          email: authUser.email || '',
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
        });
      }
      setUser(p);

      if (p.block_id) {
        const blk = await fetchBlockById(p.block_id);
        if (blk) setBlock(blk);
      } else {
        setBlock(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (!isSupabaseConfigured) return { error: 'Supabase not configured' };
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
    return { error: error?.message };
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    if (!isSupabaseConfigured) return { error: 'Supabase not configured' };
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: pass,
      options: { data: { full_name: name.trim() } },
    });
    if (error) return { error: error.message };
    if (data.user) {
      const p = await upsertProfile({ id: data.user.id, email: email.trim(), full_name: name.trim() });
      setUser(p);
    }
    return {};
  };

  const signOut = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUser(null);
    setBlock(null);
  };

  const joinBlockByCode = async (code: string): Promise<boolean> => {
    const targetBlock = await fetchBlockByCode(code);
    if (!targetBlock || !user) return false;
    setBlock(targetBlock);
    const updatedUser: UserProfile = { ...user, block_id: targetBlock.id };
    setUser(updatedUser);
    if (isSupabaseConfigured) {
      await supabase.from('profiles').update({ block_id: targetBlock.id }).eq('id', user.id);
    }
    return true;
  };

  const createBlock = async (name: string, institution: string, canvasDomain?: string, canvasToken?: string): Promise<Block> => {
    const prefix = name.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 5) || 'BLOCK';
    let newBlock: Block = {
      id: generateUUID(),
      name: name.trim().toUpperCase(),
      join_code: `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`,
      institution: institution.trim(),
      canvas_domain: canvasDomain,
      canvas_token: canvasToken,
      student_count: 1,
      created_at: new Date().toISOString(),
    };
    newBlock = await insertBlock(newBlock);
    setBlock(newBlock);
    if (user) {
      const updatedUser: UserProfile = { ...user, block_id: newBlock.id, role: 'rep' };
      setUser(updatedUser);
      if (isSupabaseConfigured) {
        await supabase.from('profiles').update({ block_id: newBlock.id, role: 'rep' }).eq('id', user.id);
      }
    }
    return newBlock;
  };

  const updateBlockCanvasCredentials = async (domain: string, token: string) => {
    if (!block) return;
    const updated = { ...block, canvas_domain: domain, canvas_token: token };
    setBlock(updated);
    if (isSupabaseConfigured && block.id) {
      await supabase.from('blocks').update({ canvas_domain: domain, canvas_token: token }).eq('id', block.id);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, block, isAuthenticated, isLoading,
      signInWithEmail, signUpWithEmail, signOut,
      joinBlockByCode, createBlock, updateBlockCanvasCredentials
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
