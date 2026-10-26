import { CanvasAPICourse, CanvasAPIAssignment, Course, Assignment } from '@/types';

export interface CanvasCredentials {
  domain: string;
  token: string;
}

export const SAMPLE_CANVAS_COURSES: CanvasAPICourse[] = [
  { id: 101, name: 'Operating Systems & Concurrency', course_code: 'CS 220' },
  { id: 102, name: 'Design & Analysis of Algorithms', course_code: 'CS 210' },
  { id: 103, name: 'Database Systems & Architecture', course_code: 'CS 230' },
  { id: 104, name: 'Full-Stack Web Engineering', course_code: 'CS 245' },
];

export const SAMPLE_CANVAS_ASSIGNMENTS: CanvasAPIAssignment[] = [
  {
    id: 501,
    name: 'Thread Scheduling & CPU Priority Simulator',
    description: 'Implement Round Robin and Multilevel Feedback Queue scheduling in C. Submit source and test runs.',
    due_at: new Date(Date.now() + 36 * 3600000).toISOString(),
    unlock_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    lock_at: new Date(Date.now() + 48 * 3600000).toISOString(),
    html_url: 'https://canvas.instructure.com/courses/101/assignments/501',
    course_id: 101,
  },
  {
    id: 502,
    name: 'Dynamic Programming & Matrix Chain Multiplication',
    description: 'Optimal parenthesization and Bellman-Ford shortest paths problem set.',
    due_at: new Date(Date.now() + 72 * 3600000).toISOString(),
    unlock_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    lock_at: new Date(Date.now() + 84 * 3600000).toISOString(),
    html_url: 'https://canvas.instructure.com/courses/102/assignments/502',
    course_id: 102,
  },
  {
    id: 503,
    name: 'Relational Schema Normalization & BCNF Decomposition',
    description: 'Derive minimal covers, identify candidate keys, and decompose to BCNF with dependency preservation.',
    due_at: new Date(Date.now() + 144 * 3600000).toISOString(),
    unlock_at: new Date(Date.now() - 96 * 3600000).toISOString(),
    lock_at: new Date(Date.now() + 168 * 3600000).toISOString(),
    html_url: 'https://canvas.instructure.com/courses/103/assignments/503',
    course_id: 103,
  },
];

async function fetchCanvasAPI(targetUrl: string, token: string): Promise<any> {
  const proxyUrl = `/api/canvas-proxy?url=${encodeURIComponent(targetUrl)}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 1. Primary: Netlify Proxy (same-origin, bypasses browser CORS)
  try {
    const res = await fetch(proxyUrl, { headers });
    if (res.ok) {
      return await res.json();
    }
    const errText = await res.text();
    console.warn(`Canvas proxy HTTP ${res.status}:`, errText);
  } catch (proxyErr) {
    console.warn('Canvas proxy request failed, trying direct fetch...', proxyErr);
  }

  // 2. Direct fallback (for non-browser or when proxy is bypassed)
  try {
    const directRes = await fetch(targetUrl, { headers });
    if (directRes.ok) {
      return await directRes.json();
    }
  } catch (directErr) {
    console.warn('Direct Canvas fetch blocked by browser CORS:', directErr);
  }

  return null;
}

export async function fetchCanvasCourses(domain: string, token: string): Promise<CanvasAPICourse[]> {
  const cleanDomain = domain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  const url = `https://${cleanDomain}/api/v1/courses?enrollment_state=active&per_page=50`;

  const data = await fetchCanvasAPI(url, token);
  if (Array.isArray(data) && data.length > 0) {
    return data;
  }
  if (Array.isArray(data)) {
    return data;
  }
  console.warn('Using sample Canvas courses for demo.');
  return SAMPLE_CANVAS_COURSES;
}

export async function fetchCanvasAssignments(
  domain: string,
  token: string,
  courseId: number
): Promise<CanvasAPIAssignment[]> {
  const cleanDomain = domain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  const url = `https://${cleanDomain}/api/v1/courses/${courseId}/assignments?per_page=50`;

  const data = await fetchCanvasAPI(url, token);
  if (Array.isArray(data)) {
    return data;
  }
  return SAMPLE_CANVAS_ASSIGNMENTS.filter((a) => a.course_id === courseId);
}

export function transformCanvasCourse(c: CanvasAPICourse, blockId: string): Course {
  return {
    id: `crs_canvas_${c.id}`,
    canvas_course_id: String(c.id),
    title: c.name,
    course_code: c.course_code || `CRS-${c.id}`,
    block_id: blockId,
  };
}

export function transformCanvasAssignment(
  a: CanvasAPIAssignment,
  course: Course,
  blockId: string
): Assignment {
  const due = a.due_at || new Date(Date.now() + 7 * 86400000).toISOString();
  return {
    id: `asg_canvas_${a.id}`,
    canvas_assignment_id: String(a.id),
    course_id: course.id,
    block_id: blockId,
    title: a.name,
    course_code: course.course_code,
    course_name: course.title,
    description: a.description ? a.description.replace(/<[^>]*>?/gm, '') : 'Imported from Canvas LMS',
    due_at: due,
    due_date: due,
    open_at: a.unlock_at,
    lock_at: a.lock_at,
    canvas_url: a.html_url,
    priority: 'high',
    tags: [course.course_code, 'Canvas Sync'],
    created_at: new Date().toISOString(),
    is_completed: false,
    completed_by_count: 0,
    resources_count: 0,
    completed_peers: [],
  };
}
