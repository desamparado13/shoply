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
  product_id uuid not null references products(id) on delete cascade,
  subject text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists inventory_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('microsoft_365', 'windows_key')),
  primary_value text not null,
  secondary_value text,
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

create table if not exists troubleshooting (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  error_name text not null,
  error_image_url text,
  fix text not null,
  fix_image_url text,
  created_at timestamptz not null default now()
);

alter table products enable row level security;
alter table product_variations enable row level security;
alter table email_templates enable row level security;
alter table inventory_credentials enable row level security;
alter table notes enable row level security;
alter table sales enable row level security;
alter table troubleshooting enable row level security;

drop policy if exists "Users can manage own products" on products;
drop policy if exists "Users can manage own product variations" on product_variations;
drop policy if exists "Users can manage own email templates" on email_templates;
drop policy if exists "Users can manage own credentials" on inventory_credentials;
drop policy if exists "Users can manage own notes" on notes;
drop policy if exists "Users can manage own sales" on sales;
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
using (
  exists (
    select 1
    from products
    where products.id = email_templates.product_id
      and products.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from products
    where products.id = email_templates.product_id
      and products.user_id = auth.uid()
  )
);

create policy "Users can manage own credentials"
on inventory_credentials for all
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

create policy "Users can manage own troubleshooting"
on troubleshooting for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
