create type public.mastery_status as enum ('New', 'Practising', 'Struggling', 'Mastered');

create table public.expressions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  english text not null,
  chinese text not null,
  category text not null default 'Work Meeting',
  difficulty text not null default 'Natural',
  status public.mastery_status not null default 'New',
  tags text[] not null default '{}',
  note text not null default '',
  alternatives text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.expressions enable row level security;

create policy "Users can read own expressions"
  on public.expressions
  for select
  using (auth.uid() = user_id);

create policy "Users can create own expressions"
  on public.expressions
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own expressions"
  on public.expressions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own expressions"
  on public.expressions
  for delete
  using (auth.uid() = user_id);

create index expressions_user_created_at_idx on public.expressions (user_id, created_at desc);
create index expressions_user_category_idx on public.expressions (user_id, category);
create index expressions_user_status_idx on public.expressions (user_id, status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger expressions_set_updated_at
before update on public.expressions
for each row
execute function public.set_updated_at();
