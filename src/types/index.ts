export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';
export type ResourceType = 'FILE' | 'LINK';
export type ConversationType = 'DIRECT' | 'GROUP';
export type UserRole = 'student' | 'block_assistant' | 'rep';
export type NavigationTab = 'dashboard' | 'assignments' | 'resources' | 'classmates';

export interface NotificationPrefs {
  deadline_24h: boolean;
  deadline_1h: boolean;
  motivational: boolean;
  peer_completed: boolean;
  new_assignment: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  display_name?: string;
  avatar_url?: string;
  avatar_file_path?: string;
  bio?: string;
  year_level?: '1st' | '2nd' | '3rd' | '4th' | '5th' | 'grad';
  major?: string;
  block_id: string | null;
  role: UserRole;
  canvas_token?: string;
  notification_prefs?: NotificationPrefs;
  created_at?: string;
  updated_at?: string;
}

// Permission guards — avoids scattered role string checks throughout components
export function canModerate(user: UserProfile | null): boolean {
  return user?.role === 'block_assistant' || user?.role === 'rep';
}
export function isRep(user: UserProfile | null): boolean {
  return user?.role === 'rep';
}
export function displayName(user: UserProfile | null): string {
  if (!user) return 'Unknown';
  return user.display_name || user.full_name || user.email.split('@')[0];
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  deadline_24h: true,
  deadline_1h: true,
  motivational: true,
  peer_completed: false,
  new_assignment: true,
};

export interface Block {
  id: string;
  name: string;
  join_code: string;
  institution: string;
  description?: string;
  canvas_domain?: string;
  canvas_token?: string;
  student_count?: number;
  created_at: string;
}

export interface Course {
  id: string;
  canvas_course_id?: string;
  title: string;
  course_code: string;
  block_id: string;
  created_at?: string;
}

export interface Assignment {
  id: string;
  canvas_assignment_id?: string | null;
  course_id?: string | null;
  block_id: string;
  title: string;
  course_code?: string;
  course_name?: string;
  description: string;
  description_html?: string;
  due_at?: string;
  due_date?: string;
  open_at?: string | null;
  lock_at?: string | null;
  canvas_url?: string | null;
  priority: PriorityLevel;
  tags: string[];
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  is_completed?: boolean;
  completed_by_count?: number;
  resources_count?: number;
  completed_peers?: PeerCompletion[];
  sync_hash?: string;
  sync_source?: 'manual' | 'canvas';
  last_synced_at?: string;
}

export interface PeerCompletion {
  id: string;
  assignment_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  completed_at: string;
  confidence_rating?: number;
}

export interface ResourceItem {
  id: string;
  block_id: string;
  assignment_id?: string | null;
  assignment_title?: string;
  user_id?: string;
  uploaded_by?: string;
  title: string;
  type?: ResourceType;
  url?: string;
  file_url?: string;
  file_path?: string | null;
  file_type: 'pdf' | 'notes' | 'slides' | 'link' | 'code' | 'image' | 'other';
  file_size?: string;
  uploaded_by_name: string;
  uploaded_by_avatar?: string;
  avg_rating?: number;
  ratings_count?: number;
  user_rating?: number | null;
  downloads_count?: number;
  created_at: string;
}

export interface ResourceRating {
  id?: string;
  resource_id: string;
  user_id: string;
  rating: number;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  block_id: string;
  course_id?: string | null;
  assignment_id?: string | null;
  title?: string;
  other_user?: UserProfile;
  last_message?: Message;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  assignment_id?: string | null;
  assignment_title?: string;
  content: string;
  sender_name?: string;
  sender_avatar?: string;
  created_at: string;
}

export interface AdviceMessage {
  id: string;
  assignment_id: string;
  assignment_title?: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  receiver_id: string;
  receiver_name: string;
  message: string;
  reply?: string;
  status: 'pending' | 'answered';
  created_at: string;
}

export interface PeerPresence {
  user_id: string;
  user_name: string;
  user_avatar?: string;
  status: 'online' | 'focusing' | 'idle' | 'offline';
  current_task_id?: string;
  current_task_title?: string;
  last_seen: string;
}

export interface ActivityFeedItem {
  id: string;
  type: 'completion' | 'upload' | 'assignment_created' | 'advice_asked';
  actor_name: string;
  actor_avatar?: string;
  target_title: string;
  target_id: string;
  timestamp: string;
  badge_text?: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  block_id?: string;
  assignment_id?: string;
  type: 'deadline_24h' | 'deadline_1h' | 'deadline_missed' | 'new_assignment' |
        'resource_uploaded' | 'peer_completed' | 'motivational' | 'canvas_sync_update';
  title: string;
  body: string;
  is_read: boolean;
  delivered_at?: string;
  created_at: string;
}

export interface CanvasAPICourse {
  id: number;
  name: string;
  course_code: string;
  enrollment_term_id?: number;
}

export interface CanvasAPIAssignment {
  id: number;
  name: string;
  description?: string;
  due_at: string | null;
  unlock_at: string | null;
  lock_at: string | null;
  html_url: string;
  course_id: number;
  points_possible?: number;
}
