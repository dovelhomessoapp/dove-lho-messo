# Versione Famiglia — piano di lavoro

Ramo di sviluppo separato da main. Non pubblicare senza prove.

1. Esaminare schema Supabase e autorizzazioni effettive.
2. Integrare autenticazione email usando soltanto la chiave publishable e RLS.
3. Aggiungere sincronizzazione di oggetti, posizioni e libri, preservando l'interfaccia.
4. Preparare anteprima e migrazione prudente del backup JSON locale, comprese le foto.
5. Testare con membri di una stessa casa e utenti di case diverse.
6. Pubblicare solo dopo verifica e approvazione.

Non mettere chiavi secret o service_role nel client.
