create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null,
  price_php numeric(12, 2) not null default 0,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists product_variations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  price_php numeric(12, 2) not null default 0
);

create table if not exists email_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  category text not null default 'General' check (category in ('Windows', 'Mac', 'General')),
  subject text not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table email_templates add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table email_templates add column if not exists category text not null default 'General';
alter table email_templates alter column product_id drop not null;

update email_templates
set user_id = products.user_id
from products
where email_templates.product_id = products.id
  and email_templates.user_id is null;

create table if not exists product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  url text not null,
  created_at timestamptz not null default now()
);

alter table product_media drop constraint if exists product_media_media_type_check;
alter table product_media add constraint product_media_media_type_check check (media_type in ('image', 'video'));

create table if not exists inventory_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('microsoft_365', 'windows_key')),
  primary_value text not null,
  secondary_value text,
  created_at timestamptz not null default now()
);

create table if not exists inventory_cut_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('microsoft_365', 'windows_key')),
  primary_value text not null,
  secondary_value text,
  copied_text text not null,
  defective boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item text not null,
  amount_php numeric(12, 2) not null default 0,
  status text not null check (status in ('Paid', 'Pending')),
  created_at timestamptz not null default now()
);

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

create index if not exists sales_entries_profile_recorded_at_idx
  on sales_entries (profile_id, recorded_at desc);

create index if not exists sales_entries_recorded_date_idx
  on sales_entries (recorded_date);

create table if not exists troubleshooting (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  error_name text not null,
  error_image_url text,
  fix text not null,
  fix_image_url text,
  customer_references text,
  created_at timestamptz not null default now()
);

alter table products enable row level security;
alter table product_variations enable row level security;
alter table email_templates enable row level security;
alter table product_media enable row level security;
alter table inventory_credentials enable row level security;
alter table inventory_cut_history enable row level security;
alter table notes enable row level security;
alter table sales enable row level security;
alter table sales_entries enable row level security;
alter table defects enable row level security;
alter table troubleshooting enable row level security;

drop policy if exists "Users can manage own products" on products;
drop policy if exists "Users can manage own product variations" on product_variations;
drop policy if exists "Users can manage own email templates" on email_templates;
drop policy if exists "Users can manage own product media" on product_media;
drop policy if exists "Users can manage own credentials" on inventory_credentials;
drop policy if exists "Users can manage own cut history" on inventory_cut_history;
drop policy if exists "Users can manage own notes" on notes;
drop policy if exists "Users can manage own sales" on sales;
drop policy if exists "Authenticated users can read sales entries" on sales_entries;
drop policy if exists "Authenticated users can insert sales entries" on sales_entries;
drop policy if exists "Authenticated users can update sales entries" on sales_entries;
drop policy if exists "Authenticated users can delete sales entries" on sales_entries;
drop policy if exists "Users can manage own defects" on defects;
drop policy if exists "Users can manage own troubleshooting" on troubleshooting;

create policy "Users can manage own products"
on products for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own product variations"
on product_variations for all
using (
  exists (
    select 1
    from products
    where products.id = product_variations.product_id
      and products.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from products
    where products.id = product_variations.product_id
      and products.user_id = auth.uid()
  )
);

create policy "Users can manage own email templates"
on email_templates for all
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    product_id is null
    or exists (
      select 1
      from products
      where products.id = email_templates.product_id
        and products.user_id = auth.uid()
    )
  )
);

create policy "Users can manage own product media"
on product_media for all
using (
  exists (
    select 1
    from products
    where products.id = product_media.product_id
      and products.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from products
    where products.id = product_media.product_id
      and products.user_id = auth.uid()
  )
);

create policy "Users can manage own credentials"
on inventory_credentials for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own cut history"
on inventory_cut_history for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own notes"
on notes for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own sales"
on sales for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

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

create policy "Users can manage own defects"
on defects for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own troubleshooting"
on troubleshooting for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('defect-images', 'defect-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Users can upload own product images" on storage.objects;
drop policy if exists "Users can view product images" on storage.objects;
drop policy if exists "Users can delete own product images" on storage.objects;
drop policy if exists "Users can upload own defect images" on storage.objects;
drop policy if exists "Users can view defect images" on storage.objects;
drop policy if exists "Users can delete own defect images" on storage.objects;

create policy "Users can upload own product images"
on storage.objects for insert
with check (
  bucket_id = 'product-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can view product images"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "Users can delete own product images"
on storage.objects for delete
using (
  bucket_id = 'product-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

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
