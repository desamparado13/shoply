alter table email_templates
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table email_templates
alter column product_id drop not null;

update email_templates
set user_id = products.user_id
from products
where email_templates.product_id = products.id
  and email_templates.user_id is null;

alter table email_templates enable row level security;

drop policy if exists "Users can manage own email templates" on email_templates;

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
