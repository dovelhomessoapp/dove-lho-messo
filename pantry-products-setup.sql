-- Archivio permanente dei prodotti della famiglia, separato dalle scorte.
create table if not exists public.pantry_products (
 id uuid primary key default gen_random_uuid(),
 home_id uuid not null references public.homes(id) on delete cascade,
 barcode text,
 name text not null check (length(trim(name)) between 1 and 120),
 brand text not null default '',
 format text not null default '',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create unique index if not exists pantry_products_home_barcode_idx on public.pantry_products(home_id,barcode) where barcode is not null;
create index if not exists pantry_products_home_name_idx on public.pantry_products(home_id,name);
alter table public.pantry_products enable row level security;
drop policy if exists "pantry_products_select" on public.pantry_products;
drop policy if exists "pantry_products_insert" on public.pantry_products;
drop policy if exists "pantry_products_update" on public.pantry_products;
drop policy if exists "pantry_products_delete" on public.pantry_products;
create policy "pantry_products_select" on public.pantry_products for select to authenticated using (exists(select 1 from public.home_members m where m.home_id=pantry_products.home_id and m.user_id=auth.uid()));
create policy "pantry_products_insert" on public.pantry_products for insert to authenticated with check (exists(select 1 from public.home_members m where m.home_id=pantry_products.home_id and m.user_id=auth.uid()));
create policy "pantry_products_update" on public.pantry_products for update to authenticated using (exists(select 1 from public.home_members m where m.home_id=pantry_products.home_id and m.user_id=auth.uid())) with check (exists(select 1 from public.home_members m where m.home_id=pantry_products.home_id and m.user_id=auth.uid()));
create policy "pantry_products_delete" on public.pantry_products for delete to authenticated using (exists(select 1 from public.home_members m where m.home_id=pantry_products.home_id and m.user_id=auth.uid()));
grant select,insert,update,delete on public.pantry_products to authenticated;
