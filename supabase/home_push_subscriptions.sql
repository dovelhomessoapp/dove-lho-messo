-- Registrazioni dei dispositivi per le notifiche push.
-- Eseguire in Supabase SQL Editor. Non modifica le tabelle esistenti.
create table if not exists public.home_push_subscriptions (
 id uuid primary key default gen_random_uuid(),
 home_id uuid not null references public.homes(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 endpoint text not null,
 p256dh text not null,
 auth_secret text not null,
 device_label text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (user_id, endpoint)
);
create index if not exists home_push_subscriptions_home_idx on public.home_push_subscriptions(home_id);
alter table public.home_push_subscriptions enable row level security;
grant select, insert, update, delete on public.home_push_subscriptions to authenticated;
drop policy if exists home_push_subscriptions_select_own on public.home_push_subscriptions;
create policy home_push_subscriptions_select_own on public.home_push_subscriptions
 for select to authenticated using (user_id=(select auth.uid()) and public.is_home_member(home_id));
drop policy if exists home_push_subscriptions_insert_own on public.home_push_subscriptions;
create policy home_push_subscriptions_insert_own on public.home_push_subscriptions
 for insert to authenticated with check (user_id=(select auth.uid()) and public.is_home_member(home_id));
drop policy if exists home_push_subscriptions_update_own on public.home_push_subscriptions;
create policy home_push_subscriptions_update_own on public.home_push_subscriptions
 for update to authenticated using (user_id=(select auth.uid()) and public.is_home_member(home_id))
 with check (user_id=(select auth.uid()) and public.is_home_member(home_id));
drop policy if exists home_push_subscriptions_delete_own on public.home_push_subscriptions;
create policy home_push_subscriptions_delete_own on public.home_push_subscriptions
 for delete to authenticated using (user_id=(select auth.uid()));
