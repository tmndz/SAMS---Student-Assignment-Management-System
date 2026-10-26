export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  block_id: string | null;
  role: 'student' | 'rep';
  created_at: string;
}

export interface Block {
  id: string;
  name: string; // e.g. "CS-2A"
  join_code: string; // e.g. "CS2A-2026"
  institution: string;
  description?: string;
  student_count?: number;
  created_at: string;
}

export interface Assignment {
  id: string;
  block_id: string;
  title: string;
  course_code: string; // e.g. "CS 201"
  course_name: string; // e.g. "Data Structures & Algorithms"
  description: string;
  due_date: string; // ISO string
  priority: PriorityLevel;
  tags: string[];
  created_by: string;
  created_by_name?: string;
  created_at: string;
  // Computed / Joined properties:
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
  confidence_rating?: number; // 1-5 stars if they found it easy
}

export interface ResourceItem {
  id: string;
  block_id: string;
  assignment_id?: string | null;
  assignment_title?: string;
  title: string;
  file_url: string;
  file_type: 'pdf' | 'notes' | 'slides' | 'link' | 'code';
  file_size?: string;
  uploaded_by: string;
  uploaded_by_name: string;
  uploaded_by_avatar?: string;
  downloads_count?: number;
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

export interface AdviceMessage {
  id: string;
  assignment_id: string;
  assignment_title: string;
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
