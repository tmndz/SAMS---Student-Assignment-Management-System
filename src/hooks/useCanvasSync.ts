import { useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from './useAuth';
import {
  fetchCanvasCourses,
  fetchCanvasAssignments,
  transformCanvasCourse,
  transformCanvasAssignment,
} from '@/lib/canvas';
import { Course, Assignment } from '@/types';

export function useCanvasSync(onSyncSuccess?: (courses: Course[], assignments: Assignment[]) => void) {
  const { block, updateBlockCanvasCredentials } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(
    () => localStorage.getItem('blocksync_last_canvas_sync')
  );
  const [syncStatus, setSyncStatus] = useState<{
    coursesCount: number;
    assignmentsCount: number;
    newCount: number;
    updatedCount: number;
  } | null>(null);

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

      // 2. Fetch & transform assignments for each course
      const incoming: Assignment[] = [];
      for (const course of courses) {
        const rawAsgs = await fetchCanvasAssignments(domain, token, Number(course.canvas_course_id));
        for (const raw of rawAsgs) {
          incoming.push(transformCanvasAssignment(raw, course, block.id));
        }
      }

      let newCount = 0;
      let updatedCount = 0;

      if (isSupabaseConfigured && block.id) {
        // ── Upsert courses ──────────────────────────────────────────────────
        const courseIdMap: Record<string, string> = {};
        for (const c of courses) {
          const { data: upsertedCourse } = await supabase
            .from('courses')
            .upsert({
              canvas_course_id: c.canvas_course_id,
              title: c.title,
              course_code: c.course_code,
              block_id: block.id,
            }, { onConflict: 'block_id,canvas_course_id' })
            .select('id, canvas_course_id')
            .maybeSingle();

          if (upsertedCourse?.id && c.canvas_course_id) {
            courseIdMap[c.canvas_course_id] = upsertedCourse.id;
            c.id = upsertedCourse.id;
          }
        }

        // ── Fingerprint-based change detection (anti-duplication) ─────────────
        const incomingCanvasIds = incoming
          .map((a) => a.canvas_assignment_id)
          .filter(Boolean) as string[];

        const { data: existing } = await supabase
          .from('assignments')
          .select('id, canvas_assignment_id, sync_hash')
          .eq('block_id', block.id)
          .in('canvas_assignment_id', incomingCanvasIds);

        const existingMap = new Map<string, string>(
          (existing || []).map((r) => [r.canvas_assignment_id, r.sync_hash])
        );

        // Only write rows whose fingerprint actually changed
        const toUpsert = incoming.filter((a) => {
          if (!a.canvas_assignment_id) return true;
          const prevHash = existingMap.get(a.canvas_assignment_id);
          if (!prevHash) {
            newCount++;
            return true;
          }
          if (prevHash !== a.sync_hash) {
            updatedCount++;
            return true;
          }
          return false; // unchanged - skip write!
        });

        for (const a of toUpsert) {
          const matchingCourse = courses.find(
            (c) =>
              c.canvas_course_id === a.canvas_assignment_id ||
              c.id === a.course_id ||
              (c.canvas_course_id && a.course_id?.includes(c.canvas_course_id))
          );
          const validCourseUuid =
            matchingCourse?.id && !matchingCourse.id.startsWith('crs_')
              ? matchingCourse.id
              : a.course_id && courseIdMap[a.course_id]
              ? courseIdMap[a.course_id]
              : null;

          await supabase.from('assignments').upsert({
            canvas_assignment_id: a.canvas_assignment_id,
            course_id: validCourseUuid,
            block_id: block.id,
            title: a.title,
            description: a.description || '',
            description_html: a.description_html || '',
            due_at: a.due_at || a.due_date,
            open_at: a.open_at,
            lock_at: a.lock_at,
            canvas_url: a.canvas_url,
            priority: a.priority || 'medium',
            tags: a.tags || [],
            sync_hash: a.sync_hash,
            sync_source: 'canvas',
            last_synced_at: new Date().toISOString(),
          }, { onConflict: 'block_id,canvas_assignment_id', ignoreDuplicates: false });
        }
      }

      const timestamp = new Date().toISOString();
      setLastSynced(timestamp);
      localStorage.setItem('blocksync_last_canvas_sync', timestamp);
      setSyncStatus({
        coursesCount: courses.length,
        assignmentsCount: incoming.length,
        newCount,
        updatedCount,
      });
      onSyncSuccess?.(courses, incoming);
      return { success: true, courses, assignments: incoming, newCount, updatedCount };
    } catch (err: any) {
      console.error('Canvas sync failed:', err);
      return { success: false, error: err.message };
    } finally {
      setIsSyncing(false);
    }
  }, [block, updateBlockCanvasCredentials, onSyncSuccess]);

  return { isSyncing, lastSynced, syncStatus, syncCanvas };
}
