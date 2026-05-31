create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'Tax Accountant',
  major text not null default '',
  location text not null default 'New Zealand',
  english_style text not null default 'New Zealand',
  visual_style text not null default 'System',
  active_plan_key text not null default '',
  active_plan_started_on date not null default current_date,
  active_plan_completed_days integer[] not null default '{}',
  completed_plan_keys text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop policy if exists "Users can read own profile" on public.user_profiles;
create policy "Users can read own profile"
  on public.user_profiles
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own profile" on public.user_profiles;
create policy "Users can create own profile"
  on public.user_profiles
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own profile" on public.user_profiles;
create policy "Users can update own profile"
  on public.user_profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row
execute function public.set_updated_at();
