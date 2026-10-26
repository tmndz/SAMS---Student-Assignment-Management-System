# BlockSync ⚡
> **Lightweight, intuitive collaborative assignment tracking platform for college student cohorts.**

Built with a **100% free & open-source tech stack** (React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, and Supabase free tier / local storage sync).

---

## 🌟 Core Features (MVP Scope)

1. **Academic Block Grouping & Auth**:
   - Students join their cohort with a clean shortcode (e.g. `CS2A-SYNC`).
   - Create new academic blocks and assign Block Representatives.
   - One-click demo persona switcher (Alex Rivera, Sarah Chen, Marcus Vance) for effortless team testing.

2. **Dashboard & UI/UX Principles**:
   - **Current Priority Hero**: Prominent gradient card displaying the single most urgent upcoming task, countdown badge (`Due in 18 hours`), peer completion faces, and quick "Mark as Done" action.
   - **Quick Search Bar**: Instant real-time filter across assignments, course codes, study materials, or classmates (`Press /` shortcut).
   - **Non-Intrusive Online Indicator**: Minimal presence dots showing live cohort members and what task they are currently focusing on without visual clutter.
   - **Daily Block Activity Feed**: Live audit stream of peer completions, uploaded reviewers, and advice inquiries over the past 24 hours.

3. **Shared Assignment Board & Micro-Cards**:
   - Clean micro-cards with course code tags, urgency indicators, and completed classmate avatars.
   - Interactive modal/drawer with full requirements, guidelines, and tag metadata.
   - Confetti celebration upon marking assignments done.

4. **Peer Completion & Peer Advice Hub**:
   - View which classmates in the block have completed the task.
   - Dedicated **"Ask for Advice"** action on finished peers: sends direct questions, prompts, and study hints.
   - Mentorship drawer for viewing and replying to advice threads.

5. **Block Resource Hub**:
   - Centralized aggregation of all uploaded reviewers, cheat sheets, past exam slides, and code skeletons.
   - Drag-and-drop file upload for PDFs and study notes linked to assignments.

---

## 🚀 Quick Start (Zero-Cost Setup)

### 1. Install & Run Locally
```bash
# Install dependencies
npm install

# Start Vite fast development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

> [!NOTE]
> BlockSync includes an **automatic local storage demo fallback**. You can run and test all features immediately without configuring external cloud services!

---

## 🗄️ Database & Supabase Free-Tier Setup

When you are ready to connect to a free-tier Supabase project:

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** tab in your Supabase dashboard.
3. Paste and execute the contents of [`supabase/schema.sql`](./supabase/schema.sql).
4. Copy your project URL and Anon Public Key into a `.env` file:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
5. Restart your dev server (`npm run dev`).

### Database Architecture
- `blocks`: Academic cohort sections with join codes and institutions.
- `profiles`: User information, roles (`student`, `rep`), and block association.
- `assignments`: Block tasks, due dates, course codes, and urgency priority levels.
- `completions`: Student task completions and ratings.
- `resources`: Uploaded PDFs, cheat sheets, lecture slides, and notes.
- `peer_presence`: Live online status, heartbeat, and current task focus.
- `advice_threads`: Direct Q&A threads linked to assignments.
- `activity_logs`: Cohort activity stream.

---

## 📁 File Structure (< 150 Lines Per File)

```plaintext
├── src/
│   ├── components/
│   │   ├── ui/               # Low-level visual elements (Button, Input, Avatar, Badge, Modal)
│   │   ├── dashboard/        # PriorityHero, QuickSearchBar, DailyOverviewFeed, SetFocusModal
│   │   ├── assignments/      # AssignmentCard, AssignmentList, AssignmentDrawer, FileDropzone, CreateAssignmentModal
│   │   ├── social/           # OnlinePresenceBar, AskAdviceModal, AdviceDrawer
│   │   ├── resources/        # ResourceHub
│   │   └── layout/           # Navbar, JoinBlockModal
│   ├── lib/                  # Supabase client, mockData, date & UI utilities
│   ├── hooks/                # useAuth, useAssignments, useResources, usePresence, useAdvice
│   ├── types/                # TypeScript interfaces and unions
│   ├── App.tsx               # Main layout and view router
│   └── main.tsx              # Application entrypoint
├── supabase/
│   └── schema.sql            # PostgreSQL RLS & Schema
├── tailwind.config.js
└── package.json
```

---

## ☁️ Zero-Cost Production Deployment

Build the static production bundle:
```bash
npm run build
```
Deploy the generated `dist/` directory directly to:
- **Vercel** (`vercel --prod`)
- **Cloudflare Pages** (`npx wrangler pages deploy dist`)
- **Netlify** (`netlify deploy --prod --dir=dist`)
- **Firebase Hosting** (`firebase deploy --only hosting`)
