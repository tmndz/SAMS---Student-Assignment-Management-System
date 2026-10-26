import { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Assignment, PriorityLevel } from '@/types';
import { INITIAL_ASSIGNMENTS } from '@/lib/mockData';
import { useAuth } from './useAuth';

const STORAGE_KEY_ASG = 'blocksync_assignments_v1';

export function useAssignments() {
  const { user, block } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ASG);
    return saved ? JSON.parse(saved) : INITIAL_ASSIGNMENTS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ASG, JSON.stringify(assignments));
  }, [assignments]);

  // Assignments filtered for active block
  const blockAssignments = useMemo(() => {
    return assignments.filter((a) => a.block_id === block.id);
  }, [assignments, block.id]);

  // Current Priority Hero: the single most urgent upcoming, non-completed assignment
  const priorityHero = useMemo(() => {
    const pending = blockAssignments.filter((a) => !a.is_completed);
    if (!pending.length) return null;

    // Sort by due date (soonest first)
    return [...pending].sort(
      (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    )[0];
  }, [blockAssignments]);

  const toggleCompletion = (assignmentId: string) => {
    setAssignments((prev) =>
      prev.map((asg) => {
        if (asg.id !== assignmentId) return asg;
        const willBeCompleted = !asg.is_completed;

        if (willBeCompleted) {
          // Trigger delightful celebratory confetti
          try {
            confetti({
              particleCount: 60,
              spread: 60,
              origin: { y: 0.7 },
              colors: ['#6366f1', '#a855f7', '#3b82f6', '#10b981'],
            });
          } catch {
            // Ignore if confetti fails
          }
        }

        const peers = asg.completed_peers || [];
        let updatedPeers = peers;

        if (willBeCompleted) {
          const alreadyIn = peers.some((p) => p.user_id === user.id);
          if (!alreadyIn) {
            updatedPeers = [
              {
                id: `cmp_${Date.now()}`,
                assignment_id: asg.id,
                user_id: user.id,
                user_name: `${user.full_name} (You)`,
                user_avatar: user.avatar_url,
                completed_at: new Date().toISOString(),
                confidence_rating: 5,
              },
              ...peers,
            ];
          }
        } else {
          updatedPeers = peers.filter((p) => p.user_id !== user.id);
        }

        return {
          ...asg,
          is_completed: willBeCompleted,
          completed_by_count: updatedPeers.length,
          completed_peers: updatedPeers,
        };
      })
    );
  };

  const createAssignment = (data: {
    title: string;
    course_code: string;
    course_name: string;
    description: string;
    due_date: string;
    priority: PriorityLevel;
    tags: string[];
  }) => {
    const newAsg: Assignment = {
      id: `asg_${Date.now()}`,
      block_id: block.id,
      title: data.title,
      course_code: data.course_code.toUpperCase(),
      course_name: data.course_name,
      description: data.description,
      due_date: data.due_date,
      priority: data.priority,
      tags: data.tags,
      created_by: user.id,
      created_by_name: `${user.full_name}${user.role === 'rep' ? ' (Rep)' : ''}`,
      created_at: new Date().toISOString(),
      is_completed: false,
      completed_by_count: 0,
      resources_count: 0,
      completed_peers: [],
    };

    setAssignments((prev) => [newAsg, ...prev]);
    return newAsg;
  };

  return {
    assignments: blockAssignments,
    priorityHero,
    toggleCompletion,
    createAssignment,
  };
}
