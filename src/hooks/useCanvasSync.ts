import { useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { fetchCanvasCourses, fetchCanvasAssignments, transformCanvasCourse, transformCanvasAssignment } from '@/lib/canvas';
import { Course, Assignment } from '@/types';

export function useCanvasSync(onSyncSuccess?: (courses: Course[], assignments: Assignment[]) => void) {
  const { block, updateBlockCanvasCredentials } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(() => localStorage.getItem('blocksync_last_canvas_sync'));
  const [syncStatus, setSyncStatus] = useState<{ coursesCount: number; assignmentsCount: number } | null>(null);

  const syncCanvas = useCallback(async (domainInput?: string, tokenInput?: string) => {
    if (!block?.id) {
      return { success: false, error: 'Please join or create an academic block first.' };
    }
    const domain = domainInput || block.canvas_domain || 'canvas.instructure.com';
    const token = tokenInput || block.canvas_token || '';

    setIsSyncing(true);
    try {
      if (domainInput || tokenInput) {
        await updateBlockCanvasCredentials(domain, token);
      }

      // 1. Fetch courses from Canvas
      const rawCourses = await fetchCanvasCourses(domain, token);
      const courses: Course[] = rawCourses.map((c) => transformCanvasCourse(c, block.id));

      // 2. Fetch assignments for each course
      const assignmentsList: Assignment[] = [];
      for (const course of courses) {
        const rawAsgs = await fetchCanvasAssignments(domain, token, Number(course.canvas_course_id));
        for (const raw of rawAsgs) {
          assignmentsList.push(transformCanvasAssignment(raw, course, block.id));
        }
      }

      // 3. Supabase Upsert Strategy (Preserves completions and resources)
      if (isSupabaseConfigured && block.id) {
        const courseIdMap: Record<string, string> = {};
        for (const c of courses) {
          const { data: upsertedCourse } = await supabase.from('courses').upsert({
            canvas_course_id: c.canvas_course_id,
            title: c.title,
            course_code: c.course_code,
            block_id: block.id,
          }, { onConflict: 'block_id,canvas_course_id' }).select('id, canvas_course_id').maybeSingle();

          if (upsertedCourse?.id && c.canvas_course_id) {
            courseIdMap[c.canvas_course_id] = upsertedCourse.id;
            c.id = upsertedCourse.id;
          }
        }

        for (const a of assignmentsList) {
          const matchingCourse = courses.find((c) => c.canvas_course_id === a.canvas_assignment_id || c.id === a.course_id || (c.canvas_course_id && a.course_id?.includes(c.canvas_course_id)));
          const validCourseUuid = matchingCourse?.id && !matchingCourse.id.startsWith('crs_') ? matchingCourse.id : (a.course_id && courseIdMap[a.course_id] ? courseIdMap[a.course_id] : null);

          await supabase.from('assignments').upsert({
            canvas_assignment_id: a.canvas_assignment_id,
            course_id: validCourseUuid,
            block_id: block.id,
            title: a.title,
            description: a.description || '',
            due_at: a.due_at || a.due_date,
            open_at: a.open_at,
            lock_at: a.lock_at,
            canvas_url: a.canvas_url,
            priority: a.priority || 'medium',
            tags: a.tags || [],
          }, { onConflict: 'block_id,canvas_assignment_id' });
        }
      }

      const timestamp = new Date().toISOString();
      setLastSynced(timestamp);
      localStorage.setItem('blocksync_last_canvas_sync', timestamp);
      setSyncStatus({ coursesCount: courses.length, assignmentsCount: assignmentsList.length });
      onSyncSuccess?.(courses, assignmentsList);
      return { success: true, courses, assignments: assignmentsList };
    } catch (err: any) {
      console.error('Canvas sync failed:', err);
      return { success: false, error: err.message };
    } finally {
      setIsSyncing(false);
    }
  }, [block, updateBlockCanvasCredentials, onSyncSuccess]);

  return { isSyncing, lastSynced, syncStatus, syncCanvas };
}
