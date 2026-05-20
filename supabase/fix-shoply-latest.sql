create table if not exists product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  url text not null,
  created_at timestamptz not null default now()
);

alter table product_media drop constraint if exists product_media_media_type_check;
alter table product_media add constraint product_media_media_type_check check (media_type in ('image', 'video'));

alter table email_templates add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table email_templates add column if not exists category text not null default 'General';
alter table email_templates alter column product_id drop not null;
alter table troubleshooting add column if not exists customer_references text;

update email_templates
set user_id = products.user_id
from products
where email_templates.product_id = products.id
  and email_templates.user_id is null;

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

alter table product_media enable row level security;
alter table email_templates enable row level security;
alter table inventory_cut_history enable row level security;

drop policy if exists "Users can manage own product media" on product_media;
drop policy if exists "Users can manage own email templates" on email_templates;
drop policy if exists "Users can manage own cut history" on inventory_cut_history;

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

create policy "Users can manage own cut history"
on inventory_cut_history for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Users can upload own product images" on storage.objects;
drop policy if exists "Users can view product images" on storage.objects;
drop policy if exists "Users can delete own product images" on storage.objects;

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
