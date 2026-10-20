-- CASA DOLCE CASA | MIGRAZIONE 01
-- Non eseguita automaticamente. Eseguire in SQL Editor Supabase solo dopo backup.
-- Modifica additiva: nessuna DELETE, DROP o aggiornamento ai dati preesistenti.
BEGIN;
CREATE TABLE IF NOT EXISTS public.family_nicknames (
 home_id uuid NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 nickname text NOT NULL CHECK (length(btrim(nickname)) BETWEEN 1 AND 40),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (home_id,user_id)
);
ALTER TABLE public.family_nicknames ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS family_nicknames_read_home ON public.family_nicknames;
CREATE POLICY family_nicknames_read_home ON public.family_nicknames
 FOR SELECT TO authenticated USING (public.is_home_member(home_id));
DROP POLICY IF EXISTS family_nicknames_insert_self ON public.family_nicknames;
CREATE POLICY family_nicknames_insert_self ON public.family_nicknames
 FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid() AND public.is_home_member(home_id));
DROP POLICY IF EXISTS family_nicknames_update_self ON public.family_nicknames;
CREATE POLICY family_nicknames_update_self ON public.family_nicknames
 FOR UPDATE TO authenticated USING (user_id=auth.uid() AND public.is_home_member(home_id))
 WITH CHECK (user_id=auth.uid() AND public.is_home_member(home_id));
-- Niente DELETE policy: soltanto l'utente può cambiare il proprio nickname.
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS parent_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS locations_id_home_unique ON public.locations(id,home_id);
DO $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.locations'::regclass AND conname='locations_parent_same_home') THEN
  ALTER TABLE public.locations ADD CONSTRAINT locations_parent_same_home
   FOREIGN KEY (parent_id,home_id) REFERENCES public.locations(id,home_id);
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.locations'::regclass AND conname='locations_not_own_parent') THEN
  ALTER TABLE public.locations ADD CONSTRAINT locations_not_own_parent
   CHECK(parent_id IS NULL OR parent_id<>id);
 END IF;
END $$;
-- L'autore di un oggetto storico resta quello effettivamente presente, anche se NULL.
-- La protezione di created_by e updated_by richiede trigger separati,
-- da completare e verificare prima della pubblicazione della funzione "Ultima modifica".
COMMIT;
