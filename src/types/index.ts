export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';
export type ResourceType = 'FILE' | 'LINK';
export type ConversationType = 'DIRECT' | 'GROUP';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  block_id: string | null;
  role: 'student' | 'rep';
  canvas_token?: string;
  created_at?: string;
}

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
  rating: number; // 1 to 5
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
