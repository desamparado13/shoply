create table if not exists sales_entries (
  id uuid primary key default gen_random_uuid(),
  profile_id text not null,
  profile_name text,
  gross numeric(12, 2) not null default 0,
  ads numeric(12, 2) not null default 0,
  net numeric(12, 2) not null default 0,
  currency text not null default 'PHP',
  note text,
  recorded_at timestamptz not null,
  recorded_date date,
  recorded_time time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sales_entries_profile_recorded_at_idx
  on sales_entries (profile_id, recorded_at desc);

create index if not exists sales_entries_recorded_date_idx
  on sales_entries (recorded_date);

alter table sales_entries enable row level security;

drop policy if exists "Authenticated users can read sales entries" on sales_entries;
drop policy if exists "Authenticated users can insert sales entries" on sales_entries;
drop policy if exists "Authenticated users can update sales entries" on sales_entries;
drop policy if exists "Authenticated users can delete sales entries" on sales_entries;

create policy "Authenticated users can read sales entries"
on sales_entries for select
to authenticated
using (true);

create policy "Authenticated users can insert sales entries"
on sales_entries for insert
to authenticated
with check (true);

create policy "Authenticated users can update sales entries"
on sales_entries for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete sales entries"
on sales_entries for delete
to authenticated
using (true);
