alter table inventory_credentials
  drop constraint if exists inventory_credentials_kind_check;

alter table inventory_credentials
  add constraint inventory_credentials_kind_check
  check (kind in ('microsoft_365', 'windows_key', 'pro_plus_key'));

alter table inventory_cut_history
  drop constraint if exists inventory_cut_history_kind_check;

alter table inventory_cut_history
  add constraint inventory_cut_history_kind_check
  check (kind in ('microsoft_365', 'windows_key', 'pro_plus_key'));
