alter table inventory_credentials enable row level security;

drop policy if exists "Users can manage own credentials" on inventory_credentials;

create policy "Users can manage own credentials"
on inventory_credentials for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
