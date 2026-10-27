-- Impostazioni notifiche per ogni casa, senza modificare i dati esistenti.
create table if not exists public.home_notification_settings (
  home_id uuid primary key references public.homes(id) on delete cascade,
  audience text not null default 'owner' check (audience in ('owner','all','none')),
  reminder_days integer[] not null default array[5,3,1,0]::integer[],
  reminder_hour integer not null default 13 check (reminder_hour between 0 and 23),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
alter table public.home_notification_settings enable row level security;
drop policy if exists home_notification_settings_select on public.home_notification_settings;
create policy home_notification_settings_select on public.home_notification_settings
 for select to authenticated using (
  exists (select 1 from public.home_members m where m.home_id = home_notification_settings.home_id and m.user_id = (select auth.uid()))
 );
drop policy if exists home_notification_settings_insert on public.home_notification_settings;
create policy home_notification_settings_insert on public.home_notification_settings
 for insert to authenticated with check (
  updated_by = (select auth.uid()) and
  exists (select 1 from public.home_members m where m.home_id = home_notification_settings.home_id and m.user_id = (select auth.uid()) and m.role = 'owner')
 );
drop policy if exists home_notification_settings_update on public.home_notification_settings;
create policy home_notification_settings_update on public.home_notification_settings
 for update to authenticated using (
  exists (select 1 from public.home_members m where m.home_id = home_notification_settings.home_id and m.user_id = (select auth.uid()) and m.role = 'owner')
 ) with check (
  updated_by = (select auth.uid()) and
  exists (select 1 from public.home_members m where m.home_id = home_notification_settings.home_id and m.user_id = (select auth.uid()) and m.role = 'owner')
 );
