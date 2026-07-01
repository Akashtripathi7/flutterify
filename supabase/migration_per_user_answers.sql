-- ============================================================
--  RUN THIS in Supabase → SQL Editor → New query, then click RUN.
--  Lets the app overwrite a cached answer when the learner regenerates
--  (upsert needs an UPDATE policy, not just INSERT). Safe to re-run.
-- ============================================================

drop policy if exists "answers: update authed" on public.question_answers;

create policy "answers: update authed"
  on public.question_answers
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
