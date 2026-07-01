-- ============================================================
--  Interview Prep — Supabase schema
--  Run this in the Supabase SQL editor (Dashboard -> SQL -> New query).
--  Safe to re-run: uses IF NOT EXISTS / OR REPLACE throughout.
-- ============================================================

-- ---------- profiles (one row per auth user) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: self read"   on public.profiles;
drop policy if exists "profiles: self upsert" on public.profiles;
drop policy if exists "profiles: self update" on public.profiles;

create policy "profiles: self read"   on public.profiles for select using (auth.uid() = id);
create policy "profiles: self upsert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles: self update" on public.profiles for update using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- question_answers (GLOBAL cache — the "hashmap for consistency") ----------
-- One canonical answer per question_id, shared by every user so the same
-- question always shows the same explanation and we never re-spend tokens.
create table if not exists public.question_answers (
  question_id    text primary key,
  track_id       text not null,
  day_id         text,
  answer_md      text not null,
  flashcards     jsonb default '[]'::jsonb,
  model          text,
  input_tokens   int  default 0,
  output_tokens  int  default 0,
  generated_by   uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now()
);

-- For installs created before flashcards existed:
alter table public.question_answers add column if not exists flashcards jsonb default '[]'::jsonb;

alter table public.question_answers enable row level security;

drop policy if exists "answers: read all"      on public.question_answers;
drop policy if exists "answers: insert authed" on public.question_answers;
drop policy if exists "answers: update authed" on public.question_answers;

-- Any signed-in user can read every cached answer (it's curriculum content).
create policy "answers: read all"      on public.question_answers for select using (auth.role() = 'authenticated');
-- A signed-in user may write a cache entry (first person to open a question fills it).
create policy "answers: insert authed" on public.question_answers for insert with check (auth.role() = 'authenticated');
-- …and may overwrite it when regenerating (upsert needs UPDATE too).
create policy "answers: update authed" on public.question_answers for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---------- progress (per user, per question) ----------
create table if not exists public.progress (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references auth.users (id) on delete cascade,
  question_id   text not null,
  day_id        text,
  track_id      text,
  status        text not null default 'done' check (status in ('done', 'flagged')),
  code          text,            -- submitted code for logic-building questions
  answer_md     text,            -- the explanation the user saved when marking "understood"
  flashcards    jsonb default '[]'::jsonb,  -- flashcards saved alongside that answer
  updated_at    timestamptz not null default now(),
  unique (user_id, question_id)
);

-- For installs created before these columns existed:
alter table public.progress add column if not exists code text;
alter table public.progress add column if not exists answer_md text;
alter table public.progress add column if not exists flashcards jsonb default '[]'::jsonb;

alter table public.progress enable row level security;

drop policy if exists "progress: self all" on public.progress;
create policy "progress: self all" on public.progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists progress_user_idx on public.progress (user_id);

-- ---------- error_journal: removed ----------
-- The journal flow was removed from the app. Drop the table if it exists.
drop table if exists public.error_journal;

-- Wipe all of the current user's progress (Settings -> Clear data).
create or replace function public.clear_my_progress()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.progress where user_id = auth.uid();
end;
$$;

-- ---------- token_usage (per user, per day) ----------
create table if not exists public.token_usage (
  user_id       uuid not null references auth.users (id) on delete cascade,
  usage_date    date not null default current_date,
  tokens_used   int  not null default 0,
  primary key (user_id, usage_date)
);

alter table public.token_usage enable row level security;

drop policy if exists "usage: self all" on public.token_usage;
create policy "usage: self all" on public.token_usage
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Atomically add tokens to today's bucket and return the new total.
create or replace function public.add_token_usage(p_tokens int)
returns int
language plpgsql
security definer set search_path = public
as $$
declare
  new_total int;
begin
  insert into public.token_usage (user_id, usage_date, tokens_used)
  values (auth.uid(), current_date, p_tokens)
  on conflict (user_id, usage_date)
  do update set tokens_used = public.token_usage.tokens_used + p_tokens
  returning tokens_used into new_total;
  return new_total;
end;
$$;
