create table if not exists product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  media_type text not null check (media_type in ('video')),
  url text not null,
  created_at timestamptz not null default now()
);

alter table product_media enable row level security;

drop policy if exists "Users can manage own product media" on product_media;

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
