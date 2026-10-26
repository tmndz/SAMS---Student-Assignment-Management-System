-- ==============================================================================
-- BlockSync Database Schema (PostgreSQL for Supabase)
-- Collaborative Student Assignment Tracking & Academic Block Platform
-- ==============================================================================

-- 1. EXTENSIONS & HELPERS
create extension if not exists "uuid-ossp";

-- 2. ACADEMIC BLOCKS (Cohorts, e.g. CS-2A)
create table public.blocks (
  id uuid primary key default uuid_generate_v4(),
  name text not null, -- e.g. 'CS-2A'
  join_code text unique not null, -- e.g. 'CS2A-2026'
  institution text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. PROFILES (Extends Supabase Auth users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  avatar_url text,
  block_id uuid references public.blocks(id) on delete set null,
  role text check (role in ('student', 'rep')) default 'student',
  theme_preference text default 'dark',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. SHARED ASSIGNMENTS
create table public.assignments (
  id uuid primary key default uuid_generate_v4(),
  block_id uuid not null references public.blocks(id) on delete cascade,
  title text not null,
  course_code text not null, -- e.g. 'CS 220'
  course_name text not null, -- e.g. 'Operating Systems'
  description text default '',
  due_date timestamp with time zone not null,
  priority text check (priority in ('low', 'medium', 'high', 'urgent')) default 'medium',
  tags text[] default array[]::text[],
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. PEER COMPLETIONS (Marks assignments as done)
create table public.completions (
  id uuid primary key default uuid_generate_v4(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  confidence_rating int check (confidence_rating between 1 and 5) default 5,
  notes text,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (assignment_id, user_id)
);

-- 6. SHARED RESOURCES & REVIEWERS
create table public.resources (
  id uuid primary key default uuid_generate_v4(),
  block_id uuid not null references public.blocks(id) on delete cascade,
  assignment_id uuid references public.assignments(id) on delete set null,
  title text not null,
  file_url text not null,
  file_type text check (file_type in ('pdf', 'notes', 'slides', 'link', 'code')) default 'pdf',
  file_size text,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  downloads_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. LIVE PRESENCE & FOCUS STATE
create table public.peer_presence (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  block_id uuid not null references public.blocks(id) on delete cascade,
  status text check (status in ('online', 'focusing', 'idle', 'offline')) default 'online',
  current_task_id uuid references public.assignments(id) on delete set null,
  last_seen timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. PEER ADVICE & MENTORSHIP THREADS
create table public.advice_threads (
  id uuid primary key default uuid_generate_v4(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  reply text,
  status text check (status in ('pending', 'answered')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. ACTIVITY FEED / AUDIT LOG
create table public.activity_logs (
  id uuid primary key default uuid_generate_v4(),
  block_id uuid not null references public.blocks(id) on delete cascade,
  type text check (type in ('completion', 'upload', 'assignment_created', 'advice_asked')),
  actor_id uuid references public.profiles(id) on delete set null,
  target_id uuid,
  target_title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.blocks enable row level security;
alter table public.profiles enable row level security;
alter table public.assignments enable row level security;
alter table public.completions enable row level security;
alter table public.resources enable row level security;
alter table public.peer_presence enable row level security;
alter table public.advice_threads enable row level security;
alter table public.activity_logs enable row level security;

-- Blocks: users can view the block they belong to, or look up by join_code
create policy "Users can view their own block"
  on public.blocks for select
  using (true);

-- Profiles: visible to other peers in the same academic block
create policy "Profiles visible to block mates"
  on public.profiles for select
  using (
    block_id is null or 
    block_id in (select block_id from public.profiles where id = auth.uid())
  );

create policy "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid());

-- Assignments: visible and editable by users in the same block
create policy "Block assignments viewable by block mates"
  on public.assignments for select
  using (
    block_id in (select block_id from public.profiles where id = auth.uid())
  );

create policy "Block assignments insertable by block mates"
  on public.assignments for insert
  with check (
    block_id in (select block_id from public.profiles where id = auth.uid())
  );

-- Completions: viewable by all block mates, insertable by the user
create policy "Completions viewable by block mates"
  on public.completions for select
  using (true);

create policy "Users can toggle their own completions"
  on public.completions for all
  using (user_id = auth.uid());

-- Resources: viewable and uploadable by block mates
create policy "Resources viewable by block mates"
  on public.resources for select
  using (
    block_id in (select block_id from public.profiles where id = auth.uid())
  );

create policy "Resources insertable by block mates"
  on public.resources for insert
  with check (
    block_id in (select block_id from public.profiles where id = auth.uid())
  );

-- Realtime publication
alter publication supabase_realtime add table public.assignments;
alter publication supabase_realtime add table public.completions;
alter publication supabase_realtime add table public.resources;
alter publication supabase_realtime add table public.peer_presence;
alter publication supabase_realtime add table public.advice_threads;
