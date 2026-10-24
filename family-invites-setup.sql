-- Inviti familiari: installare UNA SOLA VOLTA nel SQL Editor di Supabase.
-- Non modifica gli account o i membri già esistenti.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.family_invites (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 home_id uuid NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
 email text NOT NULL,
 token_hash text NOT NULL UNIQUE,
 created_by uuid NOT NULL REFERENCES auth.users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
 accepted_at timestamptz,
 revoked_at timestamptz
);
ALTER TABLE public.family_invites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.family_invites FROM PUBLIC, anon, authenticated;
CREATE INDEX IF NOT EXISTS family_invites_home_idx ON public.family_invites(home_id);

CREATE OR REPLACE FUNCTION public.family_create_invite(p_home uuid, p_email text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_token text; v_email text := lower(btrim(p_email));
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Accesso richiesto'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.home_members WHERE home_id=p_home AND user_id=auth.uid() AND role='owner')
 THEN RAISE EXCEPTION 'Solo il proprietario può invitare'; END IF;
 IF v_email IS NULL OR v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
 THEN RAISE EXCEPTION 'Email non valida'; END IF;
 IF EXISTS (SELECT 1 FROM public.home_members m JOIN auth.users u ON u.id=m.user_id WHERE m.home_id=p_home AND lower(u.email)=v_email)
 THEN RAISE EXCEPTION 'Utente già membro'; END IF;
 v_token := encode(gen_random_bytes(32),'hex');
 INSERT INTO public.family_invites(home_id,email,token_hash,created_by)
 VALUES(p_home,v_email,encode(digest(v_token,'sha256'),'hex'),auth.uid());
 RETURN v_token;
END $$;

CREATE OR REPLACE FUNCTION public.family_accept_invite(p_token text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_inv public.family_invites%ROWTYPE; v_email text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Accesso richiesto'; END IF;
 SELECT lower(email) INTO v_email FROM auth.users WHERE id=auth.uid() AND email_confirmed_at IS NOT NULL;
 IF v_email IS NULL THEN RAISE EXCEPTION 'Conferma prima la tua email'; END IF;
 SELECT * INTO v_inv FROM public.family_invites
 WHERE token_hash=encode(digest(p_token,'sha256'),'hex')
 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at>now()
 FOR UPDATE;
 IF NOT FOUND OR v_inv.email<>v_email THEN RAISE EXCEPTION 'Invito non valido, scaduto o destinato a un’altra email'; END IF;
 IF EXISTS (SELECT 1 FROM public.home_members WHERE user_id=auth.uid() AND home_id<>v_inv.home_id)
 THEN RAISE EXCEPTION 'Account già associato a un’altra casa'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.home_members WHERE home_id=v_inv.home_id AND user_id=auth.uid()) THEN
  INSERT INTO public.home_members(home_id,user_id,role) VALUES(v_inv.home_id,auth.uid(),'member');
 END IF;
 UPDATE public.family_invites SET accepted_at=now() WHERE id=v_inv.id;
 RETURN 'Invito accettato';
END $$;

CREATE OR REPLACE FUNCTION public.family_remove_member(p_home uuid,p_user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.home_members WHERE home_id=p_home AND user_id=auth.uid() AND role='owner')
 THEN RAISE EXCEPTION 'Solo il proprietario può rimuovere membri'; END IF;
 IF p_user=auth.uid() THEN RAISE EXCEPTION 'Non puoi rimuovere il proprietario'; END IF;
 DELETE FROM public.home_members WHERE home_id=p_home AND user_id=p_user AND role='member';
END $$;

REVOKE ALL ON FUNCTION public.family_create_invite(uuid,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.family_accept_invite(text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.family_remove_member(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.family_create_invite(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.family_accept_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.family_remove_member(uuid,uuid) TO authenticated;
