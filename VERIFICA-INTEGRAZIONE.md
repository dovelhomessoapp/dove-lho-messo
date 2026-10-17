# Verifica tecnica: Dove l'ho messo? Famiglia

## Stato verificato su questo ramo
- `index.html` carica `app.js?v=v13` e contiene le schermate `home`, `items`, `books`, `places`, `add`, `detail`, `scan`.
- `app.js` conserva oggi i dati locali con `localStorage`, chiave `dlm-proto-v1`; contiene `db.places` e `db.items`. L'archivio esistente sul telefono NON va cancellato.
- L'utente ha conservato su iCloud Drive un file di backup JSON della versione attuale.
- Supabase dispone di `homes`, `home_members`, `items`, `locations`, email Auth e RLS; la Data API ora espone quattro tabelle.

## Vincoli non negoziabili
- Nessuna modifica a `main` finché non ci sono test e approvazione.
- Nessuna cancellazione automatica né sostituzione dei dati di `localStorage`.
- Mai incorporare chiavi `sb_secret_` o service_role nel client GitHub Pages.
- Le sole verifiche visuali delle policy non sostituiscono test reali di isolamento tra famiglie.

## Prerequisiti da verificare prima di codificare la migrazione
1. Definizioni di tutte le colonne (`items` e `locations` in particolare), default e vincoli SQL, per definire mapping corretto dal backup.
2. Condizioni reali di SELECT/INSERT/UPDATE/DELETE e grant dei ruoli `authenticated`; verificare i percorsi di invito dei familiari e prevenire iscrizioni in case altrui.
3. Strategia foto: immagini locali in data URL potrebbero richiedere uno Storage bucket con policy per famiglia.
4. Procedura di importazione con anteprima, duplicati evitati e verifica dei conteggi.
5. Test con due utenti della stessa famiglia e almeno uno di una seconda famiglia.

## Prossima iterazione
Implementare login e archiviazione condivisa soltanto sul ramo di sviluppo, dopo aver recuperato lo schema SQL delle tabelle. Quindi revisionare, testare, e infine proporre un merge su `main`.
