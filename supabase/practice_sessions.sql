create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expression_id uuid references public.expressions(id) on delete set null,
  transcript text not null,
  pronunciation_score integer not null check (pronunciation_score between 0 and 100),
  naturalness_score integer not null check (naturalness_score between 0 and 100),
  completeness_score integer not null check (completeness_score between 0 and 100),
  feedback_summary text,
  better_version text,
  next_step text,
  created_at timestamptz not null default now()
);

alter table public.practice_sessions
  add column if not exists feedback_summary text,
  add column if not exists better_version text,
  add column if not exists next_step text;

alter table public.practice_sessions enable row level security;

drop policy if exists "Users can read own practice sessions" on public.practice_sessions;
create policy "Users can read own practice sessions"
  on public.practice_sessions
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own practice sessions" on public.practice_sessions;
create policy "Users can create own practice sessions"
  on public.practice_sessions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own practice sessions" on public.practice_sessions;
create policy "Users can update own practice sessions"
  on public.practice_sessions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own practice sessions" on public.practice_sessions;
create policy "Users can delete own practice sessions"
  on public.practice_sessions
  for delete
  using (auth.uid() = user_id);

create index if not exists practice_sessions_user_created_at_idx on public.practice_sessions (user_id, created_at desc);
create index if not exists practice_sessions_expression_created_at_idx on public.practice_sessions (expression_id, created_at desc);
