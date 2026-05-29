alter table public.practice_sessions
  add column if not exists feedback_summary text,
  add column if not exists better_version text,
  add column if not exists next_step text;
