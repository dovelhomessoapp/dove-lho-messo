-- VERIFICA PRELIMINARE — SOLO LETTURA, nessuna modifica
SELECT table_name,column_name,data_type,is_nullable
FROM information_schema.columns
WHERE table_schema='public' AND table_name IN ('homes','home_members','items','locations','family_nicknames')
AND column_name IN ('id','home_id','user_id','created_by','updated_by','parent_id','nickname')
ORDER BY table_name,column_name;
-- Numero di oggetti e posizioni attualmente registrati
SELECT 'items' AS tabella,count(*) AS record FROM public.items
UNION ALL SELECT 'locations',count(*) FROM public.locations
UNION ALL SELECT 'homes',count(*) FROM public.homes
UNION ALL SELECT 'home_members',count(*) FROM public.home_members;
