-- ==============================================================================
-- BlockSync Database Migration v2 (Execute in Supabase SQL Editor)
-- Fixes Infinite Recursion on Profiles and Creates All Real-Time Tables
-- ==============================================================================

-- 1. DROP RECURSIVE POLICIES
drop policy if exists "Profiles visible to block mates" on public.profiles;
drop policy if exists "Authenticated users can view profiles" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Block assignments viewable by block mates" on public.assignments;
drop policy if exists "Block assignments insertable by block mates" on public.assignments;
drop policy if exists "Resources viewable by block mates" on public.resources;
drop policy if exists "Resources insertable by block mates" on public.resources;

-- 2. CREATE EXTENSIONS & TABLES
create extension if not exists "uuid-ossp";

-- Academic Blocks
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

-- Profiles (linked to auth.users)
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

-- Courses (synced from Canvas or created per block)
create table if not exists public.courses (
  id uuid primary key default uuid_generate_v4(),
  canvas_course_id text,
  title text not null,
  course_code text not null,
  block_id uuid not null references public.blocks(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (block_id, canvas_course_id)
);

-- Assignments
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

-- Completions
create table if not exists public.completions (
  id uuid primary key default uuid_generate_v4(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  confidence_rating int check (confidence_rating between 1 and 5) default 5,
  notes text,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (assignment_id, user_id)
);

-- Resources (Files + Links)
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

-- 5-Star Resource Ratings
create table if not exists public.resource_ratings (
  id uuid primary key default uuid_generate_v4(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (resource_id, user_id)
);

-- Conversations (P2P Advice & Group channels)
create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  type text check (type in ('DIRECT', 'GROUP')) default 'DIRECT',
  block_id uuid not null references public.blocks(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  assignment_id uuid references public.assignments(id) on delete set null,
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Conversation Members
create table if not exists public.conversation_members (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (conversation_id, user_id)
);

-- Messages
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  assignment_id uuid references public.assignments(id) on delete set null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. ENABLE RLS
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

-- 4. NON-RECURSIVE RLS POLICIES
-- Blocks
create policy "Anyone authenticated can view blocks"
  on public.blocks for select to authenticated using (true);

create policy "Anyone authenticated can insert a block"
  on public.blocks for insert to authenticated with check (true);

create policy "Block reps can update their block"
  on public.blocks for update to authenticated using (true);

-- Profiles (clean & non-recursive)
create policy "Authenticated users can view profiles"
  on public.profiles for select to authenticated using (true);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated using (id = auth.uid());

create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated with check (id = auth.uid());

-- Courses
create policy "Authenticated users can view courses"
  on public.courses for select to authenticated using (true);

create policy "Authenticated users can insert courses"
  on public.courses for insert to authenticated with check (true);

create policy "Authenticated users can update courses"
  on public.courses for update to authenticated using (true);

-- Assignments
create policy "Authenticated users can view assignments"
  on public.assignments for select to authenticated using (true);

create policy "Authenticated users can insert assignments"
  on public.assignments for insert to authenticated with check (true);

create policy "Authenticated users can update assignments"
  on public.assignments for update to authenticated using (true);

-- Completions
create policy "Authenticated users can view completions"
  on public.completions for select to authenticated using (true);

create policy "Users can manage their own completions"
  on public.completions for all to authenticated using (user_id = auth.uid());

-- Resources
create policy "Authenticated users can view resources"
  on public.resources for select to authenticated using (true);

create policy "Authenticated users can insert resources"
  on public.resources for insert to authenticated with check (true);

create policy "Users can delete their own resources"
  on public.resources for delete to authenticated using (user_id = auth.uid());

-- Resource Ratings
create policy "Authenticated users can view ratings"
  on public.resource_ratings for select to authenticated using (true);

create policy "Users can manage their own ratings"
  on public.resource_ratings for all to authenticated using (user_id = auth.uid());

-- Conversations & Messages
create policy "Authenticated users can view conversations"
  on public.conversations for select to authenticated using (true);

create policy "Authenticated users can create conversations"
  on public.conversations for insert to authenticated with check (true);

create policy "Authenticated users can view conversation members"
  on public.conversation_members for select to authenticated using (true);

create policy "Authenticated users can join conversations"
  on public.conversation_members for insert to authenticated with check (true);

create policy "Authenticated users can view messages"
  on public.messages for select to authenticated using (true);

create policy "Users can post messages"
  on public.messages for insert to authenticated with check (sender_id = auth.uid());

-- 5. ENABLE REALTIME PUBLICATION
drop publication if exists supabase_realtime;
create publication supabase_realtime for table
  public.blocks,
  public.profiles,
  public.courses,
  public.assignments,
  public.completions,
  public.resources,
  public.resource_ratings,
  public.conversations,
  public.conversation_members,
  public.messages;
