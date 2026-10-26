import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Block } from '@/types';
import { INITIAL_USER, INITIAL_BLOCK } from '@/lib/mockData';

interface AuthContextType {
  user: UserProfile;
  block: Block;
  allBlocks: Block[];
  switchUser: (profile: Partial<UserProfile>) => void;
  switchBlock: (blockId: string) => void;
  joinBlockByCode: (code: string) => boolean;
  createBlock: (name: string, institution: string) => Block;
}

const STORAGE_KEY_USER = 'blocksync_user';
const STORAGE_KEY_BLOCK = 'blocksync_block';

const DEMO_BLOCKS: Block[] = [
  INITIAL_BLOCK,
  {
    id: 'blk_cs3b',
    name: 'CS-3B',
    join_code: 'CS3B-PROG',
    institution: 'Faculty of Computing & Information',
    description: 'Junior Year - Distributed Systems Cohort B',
    student_count: 28,
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  const [blocks, setBlocks] = useState<Block[]>(() => {
    const saved = localStorage.getItem('blocksync_blocks_list');
    return saved ? JSON.parse(saved) : DEMO_BLOCKS;
  });

  const [block, setBlock] = useState<Block>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_BLOCK);
    return saved ? JSON.parse(saved) : INITIAL_BLOCK;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BLOCK, JSON.stringify(block));
  }, [block]);

  useEffect(() => {
    localStorage.setItem('blocksync_blocks_list', JSON.stringify(blocks));
  }, [blocks]);

  const switchUser = (newProfile: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...newProfile }));
  };

  const switchBlock = (blockId: string) => {
    const target = blocks.find((b) => b.id === blockId);
    if (target) {
      setBlock(target);
      setUser((prev) => ({ ...prev, block_id: target.id }));
    }
  };

  const joinBlockByCode = (code: string): boolean => {
    const trimmed = code.trim().toUpperCase();
    const found = blocks.find((b) => b.join_code.toUpperCase() === trimmed);
    if (found) {
      switchBlock(found.id);
      return true;
    }
    return false;
  };

  const createBlock = (name: string, institution: string): Block => {
    const newBlock: Block = {
      id: `blk_${Date.now()}`,
      name: name.trim().toUpperCase(),
      join_code: `${name.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      institution,
      student_count: 1,
      created_at: new Date().toISOString(),
    };
    setBlocks((prev) => [newBlock, ...prev]);
    setBlock(newBlock);
    setUser((prev) => ({ ...prev, block_id: newBlock.id, role: 'rep' }));
    return newBlock;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        block,
        allBlocks: blocks,
        switchUser,
        switchBlock,
        joinBlockByCode,
        createBlock,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
