-- ============================================================
--  ⚠️  RUN THIS ONCE in Supabase → SQL Editor → New query → RUN.
--  Your live database is missing columns the app needs, which is why
--  answers regenerate and "mark done" returns a 500. Safe to re-run.
-- ============================================================

-- 1. question_answers: needs a flashcards column (answer caching fails without it)
alter table public.question_answers
  add column if not exists flashcards jsonb default '[]'::jsonb;

-- 2. question_answers: allow overwriting a cached answer on regenerate (upsert -> UPDATE)
drop policy if exists "answers: update authed" on public.question_answers;
create policy "answers: update authed"
  on public.question_answers
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 3. progress: needs the code column (marking done 500s without it)
alter table public.progress
  add column if not exists code text;

-- 4. Tell PostgREST to refresh its schema cache immediately
notify pgrst, 'reload schema';

-- (optional) confirm the columns now exist:
-- select table_name, column_name
--   from information_schema.columns
--  where table_schema = 'public'
--    and table_name in ('question_answers', 'progress')
--  order by table_name, column_name;
