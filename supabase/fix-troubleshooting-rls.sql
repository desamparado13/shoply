alter table troubleshooting enable row level security;

drop policy if exists "Users can manage own troubleshooting" on troubleshooting;

create policy "Users can manage own troubleshooting"
on troubleshooting for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
