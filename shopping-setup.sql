-- Esegui una sola volta nel SQL Editor del progetto Supabase Casa dolce casa.
-- La lista è visibile e modificabile soltanto dai membri della stessa casa.
create table if not exists public.shopping_items (
 id uuid primary key default gen_random_uuid(),
 home_id uuid not null references public.homes(id) on delete cascade,
 name text not null check (length(trim(name)) between 1 and 120),
 quantity integer not null default 1 check (quantity between 1 and 99999),
 purchased boolean not null default false,
 created_at timestamptz not null default now()
);
create index if not exists shopping_items_home_idx on public.shopping_items(home_id,purchased,name);
alter table public.shopping_items enable row level security;
drop policy if exists "shopping_family_select" on public.shopping_items;
drop policy if exists "shopping_family_insert" on public.shopping_items;
drop policy if exists "shopping_family_update" on public.shopping_items;
drop policy if exists "shopping_family_delete" on public.shopping_items;
create policy "shopping_family_select" on public.shopping_items for select to authenticated using (exists(select 1 from public.home_members m where m.home_id=shopping_items.home_id and m.user_id=auth.uid()));
create policy "shopping_family_insert" on public.shopping_items for insert to authenticated with check (exists(select 1 from public.home_members m where m.home_id=shopping_items.home_id and m.user_id=auth.uid()));
create policy "shopping_family_update" on public.shopping_items for update to authenticated using (exists(select 1 from public.home_members m where m.home_id=shopping_items.home_id and m.user_id=auth.uid())) with check (exists(select 1 from public.home_members m where m.home_id=shopping_items.home_id and m.user_id=auth.uid()));
create policy "shopping_family_delete" on public.shopping_items for delete to authenticated using (exists(select 1 from public.home_members m where m.home_id=shopping_items.home_id and m.user_id=auth.uid()));
grant select,insert,update,delete on public.shopping_items to authenticated;
