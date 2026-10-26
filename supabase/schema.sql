-- ==============================================================================
-- BlockSync Database Schema v2 (PostgreSQL for Supabase)
-- Full Real-Time Sync, Canvas LMS Integration, Hybrid Resources & P2P/Group Chat
-- ==============================================================================

create extension if not exists "uuid-ossp";

-- 1. ACADEMIC BLOCKS (Cohorts, e.g. CS-2A)
create table if not exists public.blocks (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  join_code text unique not null,
  institution text not null,
  description text,
  canvas_domain text,
  canvas_token text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. PROFILES (Extends Supabase Auth users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  avatar_url text,
  block_id uuid references public.blocks(id) on delete set null,
  role text check (role in ('student', 'rep')) default 'student',
  canvas_token text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Helper security definer function to avoid recursive RLS on profiles
create or replace function public.current_user_block_id()
returns uuid
language sql
security definer
stable
as $$
  select block_id from public.profiles where id = auth.uid() limit 1;
$$;

-- 3. COURSES (Synced from Canvas LMS or manually created per block)
create table if not exists public.courses (
  id uuid primary key default uuid_generate_v4(),
  canvas_course_id text,
  title text not null,
  course_code text not null,
  block_id uuid not null references public.blocks(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (block_id, canvas_course_id)
);

-- 4. ASSIGNMENTS (Synced from Canvas LMS or published by cohort)
create table if not exists public.assignments (
  id uuid primary key default uuid_generate_v4(),
  canvas_assignment_id text,
  course_id uuid references public.courses(id) on delete set null,
  block_id uuid not null references public.blocks(id) on delete cascade,
  title text not null,
  description text default '',
  due_at timestamp with time zone not null,
  open_at timestamp with time zone,
  lock_at timestamp with time zone,
  canvas_url text,
  priority text check (priority in ('low', 'medium', 'high', 'urgent')) default 'medium',
  tags text[] default array[]::text[],
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (block_id, canvas_assignment_id)
);

-- 5. COMPLETIONS (Peer task completion tracking)
create table if not exists public.completions (
  id uuid primary key default uuid_generate_v4(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  confidence_rating int check (confidence_rating between 1 and 5) default 5,
  notes text,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (assignment_id, user_id)
);

-- 6. MIXED STUDY RESOURCES (Files via Supabase Storage + External Links)
create table if not exists public.resources (
  id uuid primary key default uuid_generate_v4(),
  block_id uuid not null references public.blocks(id) on delete cascade,
  assignment_id uuid references public.assignments(id) on delete set null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  type text check (type in ('FILE', 'LINK')) default 'FILE',
  url text not null,
  file_path text,
  file_size text,
  file_type text check (file_type in ('pdf', 'notes', 'slides', 'link', 'code', 'image', 'other')) default 'pdf',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. 5-STAR RESOURCE RATINGS
create table if not exists public.resource_ratings (
  id uuid primary key default uuid_generate_v4(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (resource_id, user_id)
);

-- 8. CONVERSATIONS (P2P Advice & Cohort/Course Group Channels)
create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  type text check (type in ('DIRECT', 'GROUP')) default 'DIRECT',
  block_id uuid not null references public.blocks(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  assignment_id uuid references public.assignments(id) on delete set null,
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. CONVERSATION MEMBERS
create table if not exists public.conversation_members (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (conversation_id, user_id)
);

-- 10. REAL-TIME MESSAGES
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  assignment_id uuid references public.assignments(id) on delete set null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. STORAGE BUCKET FOR STUDY MATERIALS
insert into storage.buckets (id, name, public)
values ('study_materials', 'study_materials', true)
on conflict (id) do update set public = true;

-- 12. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.blocks enable row level security;
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.assignments enable row level security;
alter table public.completions enable row level security;
alter table public.resources enable row level security;
alter table public.resource_ratings enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

-- Blocks RLS
create policy "Anyone authenticated can view blocks"
  on public.blocks for select to authenticated using (true);

create policy "Anyone authenticated can create a block"
  on public.blocks for insert to authenticated with check (true);

-- Profiles RLS (Non-recursive)
create policy "Authenticated users can view profiles"
  on public.profiles for select to authenticated using (true);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated using (id = auth.uid());

create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated with check (id = auth.uid());

-- Courses RLS
create policy "Block members can view courses"
  on public.courses for select to authenticated
  using (block_id = public.current_user_block_id());

create policy "Block members can insert courses"
  on public.courses for insert to authenticated
  with check (block_id = public.current_user_block_id());

create policy "Block members can update courses"
  on public.courses for update to authenticated
  using (block_id = public.current_user_block_id());

-- Assignments RLS
create policy "Block members can view assignments"
  on public.assignments for select to authenticated
  using (block_id = public.current_user_block_id());

create policy "Block members can insert assignments"
  on public.assignments for insert to authenticated
  with check (block_id = public.current_user_block_id());

create policy "Block members can update assignments"
  on public.assignments for update to authenticated
  using (block_id = public.current_user_block_id());

-- Completions RLS
create policy "Block members can view completions"
  on public.completions for select to authenticated using (true);

create policy "Users can manage their own completions"
  on public.completions for all to authenticated using (user_id = auth.uid());

-- Resources RLS
create policy "Block members can view resources"
  on public.resources for select to authenticated
  using (block_id = public.current_user_block_id());

create policy "Block members can upload resources"
  on public.resources for insert to authenticated
  with check (block_id = public.current_user_block_id());

create policy "Users can delete their uploaded resources"
  on public.resources for delete to authenticated
  using (user_id = auth.uid());

-- Resource Ratings RLS
create policy "Authenticated users can view ratings"
  on public.resource_ratings for select to authenticated using (true);

create policy "Users can manage their own ratings"
  on public.resource_ratings for all to authenticated using (user_id = auth.uid());

-- Conversations & Members RLS
create policy "Conversation members can view conversations"
  on public.conversations for select to authenticated
  using (
    type = 'GROUP' and block_id = public.current_user_block_id()
    or id in (select conversation_id from public.conversation_members where user_id = auth.uid())
  );

create policy "Authenticated users can create conversations"
  on public.conversations for insert to authenticated with check (true);

create policy "Members can view membership"
  on public.conversation_members for select to authenticated using (true);

create policy "Members can join conversations"
  on public.conversation_members for insert to authenticated with check (true);

-- Messages RLS
create policy "Conversation members can read messages"
  on public.messages for select to authenticated
  using (
    conversation_id in (
      select id from public.conversations where type = 'GROUP' and block_id = public.current_user_block_id()
      union
      select conversation_id from public.conversation_members where user_id = auth.uid()
    )
  );

create policy "Conversation members can post messages"
  on public.messages for insert to authenticated
  with check (sender_id = auth.uid());

-- Storage policies for study_materials bucket
create policy "Anyone authenticated can view study materials"
  on storage.objects for select to authenticated
  using (bucket_id = 'study_materials');

create policy "Anyone authenticated can upload study materials"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'study_materials');

-- 13. ENABLE SUPABASE REALTIME
alter publication supabase_realtime add table public.assignments;
alter publication supabase_realtime add table public.completions;
alter publication supabase_realtime add table public.resources;
alter publication supabase_realtime add table public.resource_ratings;
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.conversation_members;
alter publication supabase_realtime add table public.messages;
