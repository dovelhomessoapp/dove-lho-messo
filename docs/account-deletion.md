# Richieste di eliminazione account

L’utente connesso può avviare l’eliminazione da **Home → Casa dolce casa → Gestisci account**. L’app registra una sola richiesta per account e la mostra al successivo accesso.

Controlla ogni giorno **Casa dolce casa → La mia famiglia → Pannello amministratore → Richieste di eliminazione account**. Usa la data di ricezione per rispettare il termine indicato nell’app. La stessa coda è disponibile nel progetto Supabase, tabella `dlm_account_deletion_requests`. Recupera l’indirizzo email prima di eliminare l’identità: la cancellazione da Supabase Auth rimuove anche la richiesta.

1. Individua l’identità, i dati personali, i contributi e gli allegati dell’utente. Verifica se l’indirizzo o l’identità serve anche ad altri servizi del progetto e delimita la cancellazione a Dove l’ho messo?.
2. Verifica le case coinvolte e gli eventuali rinnovi Premium. Risolvi la proprietà delle case con altri membri e proteggi i loro dati. Rimuovi i dati personali e i contenuti dell’utente, inclusi foto e file nello storage. Per una casa senza altri membri da eliminare, rimuovi prima i lotti della dispensa, poi la casa.
3. Rimuovi inviti e riferimenti al richiedente oppure riassegna quelli necessari alla casa condivisa. Prima di eliminare l’identità, verifica i riferimenti in `homes.created_by`, `items.created_by`, `family_invites.created_by`, `home_invitations.invited_by` e `home_notification_settings.updated_by`, oltre ai file di proprietà dell’utente nello storage. Controlla che l’accesso a Dove l’ho messo? sia stato revocato e che i dati condivisi degli altri membri siano ancora accessibili.
4. Conferma per email la cancellazione completata e indica eventuali dati da conservare per obblighi applicabili. Verifica che la richiesta risulti chiusa. Se altri servizi usano la stessa identità e la richiesta rimane nella coda, rimuovi la singola richiesta dal Table Editor dopo aver concluso tutti i passaggi.

Per App Review, registra la conferma della richiesta su un iPhone fisico con un account di prova distinto dalle credenziali fornite al revisore.
