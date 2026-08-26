-- Migration: add Hinglish columns to question_answers
-- Run this once in Supabase SQL Editor.
alter table public.question_answers
  add column if not exists hinglish_md text,
  add column if not exists hinglish_flashcards jsonb default '[]'::jsonb;
