-- Run this in Supabase SQL Editor to add the Hinglish answer column.
-- Safe to run even if quick_prep_questions already exists.

alter table public.quick_prep_questions
  add column if not exists answer_hi_md text;
