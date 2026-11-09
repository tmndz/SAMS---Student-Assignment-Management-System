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
    description: '<p>Implement <strong>Round Robin</strong> and <strong>Multilevel Feedback Queue</strong> scheduling in C. Submit source and test runs.</p><ul><li>Provide Gantt chart visualizations</li><li>Include CPU utilization metrics</li></ul>',
    due_at: new Date(Date.now() + 36 * 3600000).toISOString(),
    unlock_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    lock_at: new Date(Date.now() + 48 * 3600000).toISOString(),
    html_url: 'https://canvas.instructure.com/courses/101/assignments/501',
    course_id: 101,
  },
  {
    id: 502,
    name: 'Dynamic Programming & Matrix Chain Multiplication',
    description: '<p>Optimal parenthesization and <em>Bellman-Ford</em> shortest paths problem set.</p><ol><li>Solve the matrix chain problem</li><li>Implement Bellman-Ford with negative cycle detection</li></ol>',
    due_at: new Date(Date.now() + 72 * 3600000).toISOString(),
    unlock_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    lock_at: new Date(Date.now() + 84 * 3600000).toISOString(),
    html_url: 'https://canvas.instructure.com/courses/102/assignments/502',
    course_id: 102,
  },
  {
    id: 503,
    name: 'Relational Schema Normalization & BCNF Decomposition',
    description: '<p>Derive minimal covers, identify candidate keys, and decompose to BCNF with dependency preservation.</p>',
    due_at: new Date(Date.now() + 144 * 3600000).toISOString(),
    unlock_at: new Date(Date.now() - 96 * 3600000).toISOString(),
    lock_at: new Date(Date.now() + 168 * 3600000).toISOString(),
    html_url: 'https://canvas.instructure.com/courses/103/assignments/503',
    course_id: 103,
  },
];

// ── Fingerprint for change-detection (prevents unnecessary upserts & duplicates) ──
export function assignmentFingerprint(a: CanvasAPIAssignment): string {
  const raw = `${a.id}|${a.due_at ?? ''}|${a.name}|${a.lock_at ?? ''}`;
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash) ^ raw.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

// ── HTML sanitiser (preserve structure, strip dangerous scripts/events) ─────────
export function sanitizeCanvasHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '');
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── Heuristic priority scoring (replaces static 'high' default) ─────────────
export function scoreAssignmentPriority(a: CanvasAPIAssignment): Assignment['priority'] {
  const hoursUntilDue = (Date.parse(a.due_at ?? '') - Date.now()) / 3600000;
  if (isNaN(hoursUntilDue) || hoursUntilDue < 0) return 'urgent';
  if (hoursUntilDue < 24) return 'urgent';
  if (hoursUntilDue < 72) return 'high';
  if (hoursUntilDue < 168) return 'medium';
  return 'low';
}

async function fetchCanvasAPI(domain: string, pathAndQuery: string, token: string): Promise<any> {
  const cleanDomain = domain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanSubPath = pathAndQuery.replace(/^\/?api\/?/, '');

  // 1. Direct Netlify CDN Edge Proxy (Instant, zero lambda, no CORS)
  if (cleanDomain.includes('lifeacademy')) {
    try {
      const edgeUrl = `/canvas-proxy/lifeacademy/${cleanSubPath}`;
      const res = await fetch(edgeUrl, { headers });
      if (res.ok) return await res.json();
    } catch {}
  } else if (cleanDomain.includes('canvas.instructure.com')) {
    try {
      const edgeUrl = `/canvas-proxy/canvas/${cleanSubPath}`;
      const res = await fetch(edgeUrl, { headers });
      if (res.ok) return await res.json();
    } catch {}
  }

  // 2. Netlify Serverless Function Proxy (/api/canvas-proxy?url=...)
  const fullTargetUrl = `https://${cleanDomain}/api/${cleanSubPath}`;
  const proxyUrl = `/api/canvas-proxy?url=${encodeURIComponent(fullTargetUrl)}`;

  try {
    const res = await fetch(proxyUrl, { headers });
    if (res.ok) return await res.json();
  } catch {}

  return null;
}

export async function fetchCanvasCourses(domain: string, token: string): Promise<CanvasAPICourse[]> {
  const data = await fetchCanvasAPI(domain, 'api/v1/courses?enrollment_state=active&per_page=50', token);
  if (Array.isArray(data) && data.length > 0) return data;
  if (Array.isArray(data)) return data;
  return SAMPLE_CANVAS_COURSES;
}

export async function fetchCanvasAssignments(
  domain: string,
  token: string,
  courseId: number
): Promise<CanvasAPIAssignment[]> {
  const data = await fetchCanvasAPI(domain, `api/v1/courses/${courseId}/assignments?per_page=50`, token);
  if (Array.isArray(data)) return data;
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
  const rawHtml = a.description || '';
  const cleanHtml = sanitizeCanvasHtml(rawHtml);
  const plainText = rawHtml ? htmlToPlainText(rawHtml) : 'Imported from Canvas LMS';

  return {
    id: `asg_canvas_${a.id}`,
    canvas_assignment_id: String(a.id),
    course_id: course.id,
    block_id: blockId,
    title: a.name,
    course_code: course.course_code,
    course_name: course.title,
    description: plainText,
    description_html: cleanHtml,
    due_at: due,
    due_date: due,
    open_at: a.unlock_at,
    lock_at: a.lock_at,
    canvas_url: a.html_url,
    priority: scoreAssignmentPriority(a),
    tags: [course.course_code, 'Canvas Sync'],
    created_at: new Date().toISOString(),
    is_completed: false,
    completed_by_count: 0,
    completed_peers: [],
    sync_hash: assignmentFingerprint(a),
    sync_source: 'canvas',
    last_synced_at: new Date().toISOString(),
  };
}
