import { useState, useEffect, useMemo } from 'react';
import { ResourceItem } from '@/types';
import { INITIAL_RESOURCES } from '@/lib/mockData';
import { useAuth } from './useAuth';

const STORAGE_KEY_RES = 'blocksync_resources_v1';

export function useResources() {
  const { user, block } = useAuth();
  const [resources, setResources] = useState<ResourceItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_RES);
    return saved ? JSON.parse(saved) : INITIAL_RESOURCES;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RES, JSON.stringify(resources));
  }, [resources]);

  const blockResources = useMemo(() => {
    return resources.filter((r) => r.block_id === block.id);
  }, [resources, block.id]);

  const addResource = (data: {
    assignment_id?: string | null;
    assignment_title?: string;
    title: string;
    file_type: 'pdf' | 'notes' | 'slides' | 'link' | 'code';
    file_size?: string;
  }) => {
    const newRes: ResourceItem = {
      id: `res_${Date.now()}`,
      block_id: block.id,
      assignment_id: data.assignment_id || null,
      assignment_title: data.assignment_title || 'General Block Reviewer',
      title: data.title,
      file_url: '#',
      file_type: data.file_type,
      file_size: data.file_size || '1.4 MB',
      uploaded_by: user.id,
      uploaded_by_name: user.full_name,
      uploaded_by_avatar: user.avatar_url,
      downloads_count: 1,
      created_at: new Date().toISOString(),
    };

    setResources((prev) => [newRes, ...prev]);
    return newRes;
  };

  const getResourcesByAssignment = (assignmentId: string) => {
    return blockResources.filter((r) => r.assignment_id === assignmentId);
  };

  return {
    resources: blockResources,
    addResource,
    getResourcesByAssignment,
  };
}
