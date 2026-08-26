-- ============================================================
--  Quick Prepare tables
--  Run once in Supabase SQL Editor.
-- ============================================================

-- Sessions: one per "card" (one resume session + one per JD upload)
create table if not exists public.quick_prep_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  type        text not null check (type in ('resume', 'jd')),
  title       text not null,           -- "Resume" or company/role name from JD
  jd_text     text,                    -- raw JD text (null for resume sessions)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.quick_prep_sessions enable row level security;
drop policy if exists "qp_sessions: self all" on public.quick_prep_sessions;
create policy "qp_sessions: self all" on public.quick_prep_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists qp_sessions_user_idx on public.quick_prep_sessions (user_id, created_at desc);

-- Questions: individual Q+A rows, belong to a session
create table if not exists public.quick_prep_questions (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.quick_prep_sessions (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  question    text not null,
  answer_md   text not null,           -- model answer markdown
  followup_md text,                    -- follow-up Q&As markdown
  position    int  not null default 0, -- ordering within session
  created_at  timestamptz not null default now()
);

alter table public.quick_prep_questions enable row level security;
drop policy if exists "qp_questions: self all" on public.quick_prep_questions;
create policy "qp_questions: self all" on public.quick_prep_questions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists qp_questions_session_idx on public.quick_prep_questions (session_id, position);
