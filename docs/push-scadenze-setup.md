# Notifiche push per le scadenze — preparazione

Stato: **NON ATTIVE**. Non pubblicizzare la funzione come operativa fino a un test con app chiusa.

## Regole di prodotto
- Orario giornaliero: **13:00 Europe/Rome**, compresi i cambi ora legale/solare.
- Promemoria configurabili: 7, 3, 1 e 0 giorni prima della scadenza.
- Per ogni lotto, utilizzare la prima data pertinente tra `expires_on` e `opened_until` (se presente).
- Ignorare lotti consumati o cancellati (`quantity <= 0`).
- Una sola notifica per lotto/giorno/dispositivo. Se più alimenti scadono insieme, preferire un riepilogo.
- Nessuna notifica senza consenso esplicito dell'utente.

## Architettura necessaria
1. Generare una coppia **VAPID** e salvare la **chiave privata esclusivamente nei secrets di Supabase**; pubblicare solo la chiave pubblica nel client.
2. Endpoint autenticato per registrare/revocare le PushSubscription. Associare ciascuna sottoscrizione all'utente autenticato e alla casa autorizzata; verificare la membership sul server. Non accettare un home_id arbitrario senza verifica.
3. Tabella server con endpoint, chiavi p256dh/auth, utente, casa, impostazioni dei giorni e stato della sottoscrizione. Applicare RLS per impedire accesso ad altre famiglie. Trattare gli endpoint come dati sensibili.
4. Scheduler server con fuso `Europe/Rome`: esecuzione alle 13:00 locali, anche quando cambia l'ora legale. Implementare un controllo idempotente per i retry.
5. La funzione server recupera i lotti della casa, filtra scadenze e quantità, applica le preferenze e invia tramite Web Push VAPID. Non inviare informazioni su altre case. Eliminare le sottoscrizioni che restituiscono 404/410.
6. Registrazione service worker e richiesta permesso **solo dopo un tocco esplicito** su «Attiva notifiche». Su iPhone serve la web app aggiunta alla schermata Home (iOS 16.4+). Gestire rifiuto del permesso e browser non supportati.
7. Test end-to-end su iPhone con app chiusa, notifica di prova, lotto con scadenza reale, nessun duplicato e revoca del consenso.

## Stato repository al 24 ottobre 2026
- UI preferenze 7/3/1/0 giorni, orario 13:00, salvate nel localStorage del dispositivo.
- Service worker con listener `push` e `notificationclick`.
- **Mancano ancora**: endpoint server, tabelle/RLS, VAPID, registrazione dispositivi, scheduler, invio effettivo.
- Non usare chiavi di servizio Supabase o VAPID private nel repository pubblico.
