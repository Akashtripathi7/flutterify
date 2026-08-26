-- Make answer columns nullable so questions can be stored before answers are generated.
alter table public.quick_prep_questions
  alter column answer_md drop not null;

alter table public.quick_prep_questions
  add column if not exists answer_hi_md text;

alter table public.quick_prep_questions
  add column if not exists followup_md text;
