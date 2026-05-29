alter table public.practice_sessions
  add column if not exists feedback_summary text,
  add column if not exists accent_score integer check (accent_score between 0 and 100),
  add column if not exists accent_focus text,
  add column if not exists pronunciation_drill text,
  add column if not exists better_version text,
  add column if not exists next_step text;
