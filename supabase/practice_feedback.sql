alter table public.practice_sessions
  add column if not exists feedback_summary text,
  add column if not exists input_mode text check (input_mode in ('voice', 'typed')),
  add column if not exists audio_duration_ms integer check (audio_duration_ms >= 0),
  add column if not exists accent_score integer check (accent_score between 0 and 100),
  add column if not exists fluency_score integer check (fluency_score between 0 and 100),
  add column if not exists accent_focus text,
  add column if not exists pronunciation_drill text,
  add column if not exists audio_note text,
  add column if not exists better_version text,
  add column if not exists next_step text;
