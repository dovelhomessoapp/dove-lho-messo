-- Eseguire una sola volta in Supabase SQL Editor.
create table if not exists public.pantry_lots (
 id uuid primary key default gen_random_uuid(),
 home_id uuid not null references public.homes(id) on delete cascade,
 name text not null check (length(trim(name)) between 1 and 120),
 zone text not null check (zone in ('dispensa','frigo','freezer')),
 quantity integer not null default 1 check (quantity between 0 and 99999),
 expires_on date,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists pantry_lots_home_idx on public.pantry_lots(home_id,expires_on);
alter table public.pantry_lots enable row level security;
drop policy if exists "pantry_family_select" on public.pantry_lots;
drop policy if exists "pantry_family_insert" on public.pantry_lots;
drop policy if exists "pantry_family_update" on public.pantry_lots;
drop policy if exists "pantry_family_delete" on public.pantry_lots;
create policy "pantry_family_select" on public.pantry_lots for select to authenticated using (exists(select 1 from public.home_members m where m.home_id=pantry_lots.home_id and m.user_id=auth.uid()));
create policy "pantry_family_insert" on public.pantry_lots for insert to authenticated with check (exists(select 1 from public.home_members m where m.home_id=pantry_lots.home_id and m.user_id=auth.uid()));
create policy "pantry_family_update" on public.pantry_lots for update to authenticated using (exists(select 1 from public.home_members m where m.home_id=pantry_lots.home_id and m.user_id=auth.uid())) with check (exists(select 1 from public.home_members m where m.home_id=pantry_lots.home_id and m.user_id=auth.uid()));
create policy "pantry_family_delete" on public.pantry_lots for delete to authenticated using (exists(select 1 from public.home_members m where m.home_id=pantry_lots.home_id and m.user_id=auth.uid()));
grant select,insert,update,delete on public.pantry_lots to authenticated;
