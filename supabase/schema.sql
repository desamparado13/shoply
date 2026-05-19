create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
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
  user_id uuid references auth.users(id) on delete cascade,
  kind text not null check (kind in ('microsoft_365', 'windows_key')),
  primary_value text not null,
  secondary_value text,
  created_at timestamptz not null default now()
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  item text not null,
  amount_php numeric(12, 2) not null default 0,
  status text not null check (status in ('Paid', 'Pending')),
  created_at timestamptz not null default now()
);

alter table products enable row level security;
alter table inventory_credentials enable row level security;
alter table notes enable row level security;
alter table sales enable row level security;

create policy "Users can manage own products"
on products for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

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
