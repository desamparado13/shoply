alter table inventory_cut_history enable row level security;

drop policy if exists "Users can manage own cut history" on inventory_cut_history;

create policy "Users can manage own cut history"
on inventory_cut_history for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
