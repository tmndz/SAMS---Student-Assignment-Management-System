# BlockSync ⚡
> **Collaborative assignment tracking, Canvas LMS sync, and peer study network for academic cohorts.**

Built with a **100% free & open-source stack**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, and Supabase (PostgreSQL, Auth, Storage, and Realtime).

---

## 🌟 Core Features & Enhancements

### 1. Authentication & Cohort/Block Syncing
- **Real Supabase Auth Sessions**: Replaces mock states with live Supabase authentication (email/password sign-in and sign-up with instant demo student profiles).
- **Academic Block Binding**: Classmates join or create their academic cohort (e.g. `CS-2A`) with unique shortcodes (e.g. `CS2A-SYNC`).
- **Live Peer Visibility**: Real-time presence indicators track active block members and their current assignment focus without screen clutter.

### 2. Canvas LMS Live Assignment Sync
- **Automated Sync Engine**: Imports active courses and deadlines directly from Canvas LMS (`/api/v1/courses`, `/api/v1/courses/:id/assignments`).
- **Non-Destructive Synchronization**: Uses an upsert strategy on `canvas_assignment_id` to ensure student completions and community-attached materials are never wiped when Canvas updates.
- **Assignment Timestamps & Deep-Links**: Tracks `open_at`, `due_at`, `lock_at`, and direct deep-links to Canvas.
- **Grouped by Course View**: Seamlessly toggle between priority grid and course-grouped layouts.

### 3. Community-Rated Hybrid Study Hub
- **Files & External Links**: Supports direct file uploads (PDFs, cheat sheets, code) stored in Supabase Storage (`study_materials` bucket) as well as external links (Google Drive, Notion, Gemini Notebook, GitHub).
- **5-Star Community Rating System**: Block members rate shared resources (1–5 stars). Resources display average ratings, vote counts, and can be sorted by highest rated or newest.

### 4. Real-Time Messaging & Collaboration Engine
- **Contextual P2P Advice Threads**: Triggered by clicking **"Ask for Advice"** on any classmate who marked an assignment as completed. Automatically opens a direct 1-on-1 thread linked to that task.
- **Group Channels**: Built-in block-wide cohort and course channels.
- **Supabase Realtime**: Instant message delivery powered by `postgres_changes`.

---

## 🗄️ Supabase Database Migration (v2)

To deploy the enhanced schema to your Supabase project:

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to the **SQL Editor**.
3. Paste and execute [`supabase/schema.sql`](./supabase/schema.sql).

### Key Tables & Policies
- `blocks`: Academic cohort sections with join codes and Canvas settings.
- `profiles`: Authenticated student accounts linked to cohorts.
- `courses`: Courses synced from Canvas or created per block.
- `assignments`: Synced deadlines with lock dates and Canvas links.
- `completions`: Student completions and ratings with uniqueness constraints.
- `resources`: Mixed materials (Files + Links) categorized by type.
- `resource_ratings`: 5-star community ratings with unique constraints per user/resource.
- `conversations` & `conversation_members`: P2P advice threads and group channels.
- `messages`: Real-time messages linked to conversations and assignments.
- `study_materials`: Storage bucket for files.
- Non-recursive RLS policies for maximum performance.

---

## 🚀 Local Development & Deployment

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Start Vite dev server
npm run dev
```

### Environment Configuration (`.env`)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Production Build & Netlify
```bash
npm run build
```
The output is written to `dist/`, ready for zero-downtime deployment on Netlify or Vercel.
