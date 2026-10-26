import { Assignment, Block, PeerPresence, ResourceItem, UserProfile, ActivityFeedItem, AdviceMessage } from '@/types';

export const INITIAL_USER: UserProfile = {
  id: 'usr_me',
  email: 'alex.rivera@university.edu',
  full_name: 'Alex Rivera',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  block_id: 'blk_cs2a',
  role: 'student',
  created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
};

export const INITIAL_BLOCK: Block = {
  id: 'blk_cs2a',
  name: 'CS-2A',
  join_code: 'CS2A-SYNC',
  institution: 'Faculty of Computing & Information',
  description: 'Sophomore Year - Computer Science Cohort A (Academic Year 2026)',
  student_count: 32,
  created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
};

// Helper for relative timestamps
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600000).toISOString();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600000).toISOString();

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg_1',
    block_id: 'blk_cs2a',
    title: 'Process Synchronization & Semaphore Lab',
    course_code: 'CS 220',
    course_name: 'Operating Systems',
    description: 'Implement the Dining Philosophers and Producer-Consumer solutions using POSIX pthread semaphores in C. Provide terminal logs and concurrency validation.',
    due_date: hoursFromNow(18), // Tomorrow morning (Priority Hero!)
    priority: 'urgent',
    tags: ['C Programming', 'POSIX', 'Concurrency'],
    created_by: 'usr_sarah',
    created_by_name: 'Sarah Chen (Rep)',
    created_at: hoursAgo(48),
    is_completed: false,
    completed_by_count: 5,
    resources_count: 3,
    completed_peers: [
      { id: 'cmp_1', assignment_id: 'asg_1', user_id: 'usr_sarah', user_name: 'Sarah Chen', user_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', completed_at: hoursAgo(6), confidence_rating: 5 },
      { id: 'cmp_2', assignment_id: 'asg_1', user_id: 'usr_marcus', user_name: 'Marcus Vance', user_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', completed_at: hoursAgo(4), confidence_rating: 4 },
      { id: 'cmp_3', assignment_id: 'asg_1', user_id: 'usr_priya', user_name: 'Priya Patel', user_avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', completed_at: hoursAgo(2), confidence_rating: 5 },
      { id: 'cmp_4', assignment_id: 'asg_1', user_id: 'usr_david', user_name: 'David Kim', user_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', completed_at: hoursAgo(1), confidence_rating: 4 },
      { id: 'cmp_5', assignment_id: 'asg_1', user_id: 'usr_elena', user_name: 'Elena Rostova', user_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80', completed_at: hoursAgo(0.5), confidence_rating: 5 }
    ]
  },
  {
    id: 'asg_2',
    block_id: 'blk_cs2a',
    title: 'Dynamic Programming & Graph Algorithmic Set',
    course_code: 'CS 210',
    course_name: 'Design & Analysis of Algorithms',
    description: 'Solve problem set #4: 0/1 Knapsack variations, Bellman-Ford shortest paths, and Floyd-Warshall all-pairs matrix optimizations.',
    due_date: hoursFromNow(64), // In ~2.5 days
    priority: 'high',
    tags: ['Algorithms', 'Python', 'Proofs'],
    created_by: 'usr_marcus',
    created_by_name: 'Marcus Vance',
    created_at: hoursAgo(72),
    is_completed: false,
    completed_by_count: 2,
    resources_count: 2,
    completed_peers: [
      { id: 'cmp_6', assignment_id: 'asg_2', user_id: 'usr_sarah', user_name: 'Sarah Chen', user_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', completed_at: hoursAgo(8), confidence_rating: 5 },
      { id: 'cmp_7', assignment_id: 'asg_2', user_id: 'usr_david', user_name: 'David Kim', user_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', completed_at: hoursAgo(5), confidence_rating: 4 }
    ]
  },
  {
    id: 'asg_3',
    block_id: 'blk_cs2a',
    title: 'Relational Schema Normalization & BCNF Decomposition',
    course_code: 'CS 230',
    course_name: 'Database Systems',
    description: 'Map business constraints to 3NF and BCNF tables. Provide functional dependency preservation matrices and SQL schema definitions.',
    due_date: hoursFromNow(120), // 5 days
    priority: 'medium',
    tags: ['SQL', 'Relational Algebra', 'Normalization'],
    created_by: 'usr_priya',
    created_by_name: 'Priya Patel',
    created_at: hoursAgo(96),
    is_completed: true,
    completed_by_count: 8,
    resources_count: 4,
    completed_peers: [
      { id: 'cmp_8', assignment_id: 'asg_3', user_id: 'usr_me', user_name: 'Alex Rivera (You)', user_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', completed_at: hoursAgo(12), confidence_rating: 5 },
      { id: 'cmp_9', assignment_id: 'asg_3', user_id: 'usr_elena', user_name: 'Elena Rostova', user_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80', completed_at: hoursAgo(24), confidence_rating: 5 },
      { id: 'cmp_10', assignment_id: 'asg_3', user_id: 'usr_marcus', user_name: 'Marcus Vance', user_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', completed_at: hoursAgo(18), confidence_rating: 4 }
    ]
  },
  {
    id: 'asg_4',
    block_id: 'blk_cs2a',
    title: 'Full-Stack RESTful API Prototype Submission',
    course_code: 'CS 245',
    course_name: 'Web Engineering',
    description: 'Build and document a JWT authenticated REST API with OpenAPI swagger docs and unit test coverage >= 80%.',
    due_date: hoursFromNow(210), // Next week
    priority: 'low',
    tags: ['TypeScript', 'Node.js', 'REST API'],
    created_by: 'usr_sarah',
    created_by_name: 'Sarah Chen (Rep)',
    created_at: hoursAgo(120),
    is_completed: false,
    completed_by_count: 1,
    resources_count: 2,
    completed_peers: [
      { id: 'cmp_11', assignment_id: 'asg_4', user_id: 'usr_marcus', user_name: 'Marcus Vance', user_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', completed_at: hoursAgo(3), confidence_rating: 5 }
    ]
  }
];

export const INITIAL_RESOURCES: ResourceItem[] = [
  {
    id: 'res_1',
    block_id: 'blk_cs2a',
    assignment_id: 'asg_1',
    assignment_title: 'Process Synchronization & Semaphore Lab',
    title: 'Dining Philosophers POSIX C Skeleton & Deadlock Analysis',
    file_url: '#',
    file_type: 'code',
    file_size: '420 KB',
    uploaded_by: 'usr_sarah',
    uploaded_by_name: 'Sarah Chen',
    uploaded_by_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    downloads_count: 24,
    created_at: hoursAgo(10)
  },
  {
    id: 'res_2',
    block_id: 'blk_cs2a',
    assignment_id: 'asg_1',
    assignment_title: 'Process Synchronization & Semaphore Lab',
    title: 'Lecture 8 Reviewer: Peterson Algorithm & Mutex vs Binary Semaphores',
    file_url: '#',
    file_type: 'pdf',
    file_size: '2.4 MB',
    uploaded_by: 'usr_priya',
    uploaded_by_name: 'Priya Patel',
    uploaded_by_avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    downloads_count: 19,
    created_at: hoursAgo(15)
  },
  {
    id: 'res_3',
    block_id: 'blk_cs2a',
    assignment_id: 'asg_2',
    assignment_title: 'Dynamic Programming & Graph Algorithmic Set',
    title: 'DP State Transition Cheat Sheet & Top-Down Memoization Patterns',
    file_url: '#',
    file_type: 'notes',
    file_size: '1.8 MB',
    uploaded_by: 'usr_david',
    uploaded_by_name: 'David Kim',
    uploaded_by_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    downloads_count: 31,
    created_at: hoursAgo(30)
  },
  {
    id: 'res_4',
    block_id: 'blk_cs2a',
    assignment_id: 'asg_3',
    assignment_title: 'Relational Schema Normalization & BCNF Decomposition',
    title: '3NF vs BCNF Step-by-Step Worked Decomposition Examples',
    file_url: '#',
    file_type: 'pdf',
    file_size: '3.1 MB',
    uploaded_by: 'usr_elena',
    uploaded_by_name: 'Elena Rostova',
    uploaded_by_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    downloads_count: 28,
    created_at: hoursAgo(40)
  },
  {
    id: 'res_5',
    block_id: 'blk_cs2a',
    assignment_id: null,
    assignment_title: 'Midterm Prep / General Reviewer',
    title: 'Midterm Comprehensive Formula & Concept Guide (All Subjects)',
    file_url: '#',
    file_type: 'slides',
    file_size: '8.5 MB',
    uploaded_by: 'usr_sarah',
    uploaded_by_name: 'Sarah Chen',
    uploaded_by_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    downloads_count: 42,
    created_at: hoursAgo(70)
  }
];

export const INITIAL_PRESENCE: PeerPresence[] = [
  {
    user_id: 'usr_sarah',
    user_name: 'Sarah Chen',
    user_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    status: 'focusing',
    current_task_id: 'asg_2',
    current_task_title: 'Algorithms DP Set',
    last_seen: new Date().toISOString()
  },
  {
    user_id: 'usr_marcus',
    user_name: 'Marcus Vance',
    user_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    current_task_id: 'asg_1',
    current_task_title: 'OS Semaphore Lab',
    last_seen: new Date().toISOString()
  },
  {
    user_id: 'usr_priya',
    user_name: 'Priya Patel',
    user_avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    status: 'focusing',
    current_task_id: 'asg_1',
    current_task_title: 'OS Semaphore Lab',
    last_seen: new Date().toISOString()
  },
  {
    user_id: 'usr_elena',
    user_name: 'Elena Rostova',
    user_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    status: 'idle',
    last_seen: hoursAgo(0.3)
  },
  {
    user_id: 'usr_david',
    user_name: 'David Kim',
    user_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    current_task_id: 'asg_3',
    current_task_title: 'Database BCNF',
    last_seen: new Date().toISOString()
  }
];

export const INITIAL_ACTIVITY: ActivityFeedItem[] = [
  {
    id: 'act_1',
    type: 'completion',
    actor_name: 'Elena Rostova',
    actor_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    target_title: 'Process Synchronization & Semaphore Lab',
    target_id: 'asg_1',
    timestamp: hoursAgo(0.5),
    badge_text: 'Done 5/5'
  },
  {
    id: 'act_2',
    type: 'upload',
    actor_name: 'Sarah Chen',
    actor_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    target_title: 'Dining Philosophers POSIX C Skeleton',
    target_id: 'res_1',
    timestamp: hoursAgo(10),
    badge_text: 'Code Snippet'
  },
  {
    id: 'act_3',
    type: 'advice_asked',
    actor_name: 'Alex Rivera (You)',
    actor_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    target_title: 'Asked Sarah Chen about deadlock edge-case',
    target_id: 'asg_1',
    timestamp: hoursAgo(12),
    badge_text: 'Resolved'
  },
  {
    id: 'act_4',
    type: 'completion',
    actor_name: 'Marcus Vance',
    actor_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    target_title: 'Process Synchronization & Semaphore Lab',
    target_id: 'asg_1',
    timestamp: hoursAgo(18),
    badge_text: 'Done'
  }
];

export const INITIAL_ADVICE_THREADS: AdviceMessage[] = [
  {
    id: 'adv_1',
    assignment_id: 'asg_1',
    assignment_title: 'Process Synchronization & Semaphore Lab',
    sender_id: 'usr_me',
    sender_name: 'Alex Rivera',
    receiver_id: 'usr_sarah',
    receiver_name: 'Sarah Chen',
    message: 'Hey Sarah! For the philosopher deadlock check, did you initialize semaphores with sem_init(&s, 0, 1) or named semaphores?',
    reply: 'I used unnamed semaphores with shared memory! Just make sure to destroy them in the cleanup handler so memory does not leak.',
    status: 'answered',
    created_at: hoursAgo(12)
  }
];
