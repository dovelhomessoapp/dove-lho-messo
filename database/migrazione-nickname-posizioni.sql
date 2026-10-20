-- CASA DOLCE CASA — migrazione PROPOSTA, non ancora eseguita
-- Conserva gli oggetti e le posizioni già registrati.
-- Eseguire soltanto dopo aver verificato uno schema SQL completo e aver creato un backup DB.
-- Nickname associato alla coppia casa + utente; la visibilità è limitata ai membri della casa.
create table if not exists public.family_nicknames (
  home_id uuid not null references public.homes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null check (char_length(trim(nickname)) between 1 and 40),
  updated_at timestamptz not null default now(),
  primary key (home_id, user_id)
);
alter table public.family_nicknames enable row level security;
create policy "family_nicknames_read_home" on public.family_nicknames
  for select to authenticated using (public.is_home_member(home_id));
create policy "family_nicknames_insert_self" on public.family_nicknames
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_home_member(home_id));
create policy "family_nicknames_update_self" on public.family_nicknames
  for update to authenticated
  using (user_id = auth.uid() and public.is_home_member(home_id))
  with check (user_id = auth.uid() and public.is_home_member(home_id));
-- Ogni posizione potrà avere una posizione genitore (NULL = livello principale).
alter table public.locations add column if not exists parent_id uuid;
-- La relazione composita richiede che figlio e genitore appartengano alla stessa casa.
create unique index if not exists locations_id_home_unique on public.locations(id, home_id);
alter table public.locations add constraint locations_parent_same_home
  foreign key (parent_id, home_id) references public.locations(id, home_id);
alter table public.locations add constraint locations_not_own_parent
  check (parent_id is null or parent_id <> id);
-- Questa FK evita collegamenti tra case diverse, ma i cicli più lunghi
-- devono essere impediti dal codice applicativo o da un trigger dedicato.
-- Autore originario: le righe già esistenti restano senza autore se non noto.
-- Assicurarsi prima che il flusso d'inserimento valorizzi created_by = auth.uid().
-- Per tracciare ultima modifica serviranno anche updated_by e updated_at
-- con un trigger protetto, non affidato al client.
