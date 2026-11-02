-- Existing Windows Pro/Home inventory remains in the Windows 10 slots.
begin;

alter table public.inventory_credentials
  drop constraint if exists inventory_credentials_kind_check;
alter table public.inventory_credentials
  add constraint inventory_credentials_kind_check
  check (kind in ('microsoft_365', 'windows_key', 'windows_pro_key', 'windows_home_key', 'windows_11_pro_key', 'windows_11_home_key', 'pro_plus_key'));

alter table public.inventory_cut_history
  drop constraint if exists inventory_cut_history_kind_check;
alter table public.inventory_cut_history
  add constraint inventory_cut_history_kind_check
  check (kind in ('microsoft_365', 'windows_key', 'windows_pro_key', 'windows_home_key', 'windows_11_pro_key', 'windows_11_home_key', 'pro_plus_key'));

commit;
