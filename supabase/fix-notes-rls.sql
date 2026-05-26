create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table notes enable row level security;

drop policy if exists "Users can manage own notes" on notes;

create policy "Users can manage own notes"
on notes for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
