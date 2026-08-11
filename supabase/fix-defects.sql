create table if not exists defects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('key', 'username')),
  value text not null,
  image_url text,
  image_path text,
  created_at timestamptz not null default now()
);

alter table defects alter column image_url drop not null;
alter table defects alter column image_path drop not null;

create index if not exists defects_user_created_at_idx
  on defects (user_id, created_at desc);

alter table defects enable row level security;

drop policy if exists "Users can manage own defects" on defects;
create policy "Users can manage own defects"
on defects for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('defect-images', 'defect-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Users can upload own defect images" on storage.objects;
drop policy if exists "Users can view defect images" on storage.objects;
drop policy if exists "Users can delete own defect images" on storage.objects;

create policy "Users can upload own defect images"
on storage.objects for insert
with check (
  bucket_id = 'defect-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can view defect images"
on storage.objects for select
using (bucket_id = 'defect-images');

create policy "Users can delete own defect images"
on storage.objects for delete
using (
  bucket_id = 'defect-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);
