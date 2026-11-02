# Android — candidato al test chiuso

App esistente: https://dovelhomessoapp.github.io/dove-lho-messo/casa-dolce-casa.html
Baseline verificata: e510d7782d98d8bc5bdc75db67ec3d0f5ccb7c46.

- Trusted Web Activity generata con Bubblewrap 1.27.0; browser helper 2.7.4.
- Package: `it.dovelhomesso.casadolcecasa`; versionName `1.0.0`; versionCode `2`.
- Android minimo: 7 (API 24). Target e compile SDK: 36.
- Notifiche web delegate alla TWA; nessun nuovo backend o database.
- Nuovi acquisti Stripe disabilitati solo nel contesto Play; abbonamenti già attivi letti tramite lo stesso controllo esistente. Il sito continua a usare Stripe.
- La versione Android iniziale è senza acquisti interni. Prima di abilitare acquisti occorre integrare Play Billing o aderire a un programma alternativo applicabile.

## Compilazione riproducibile

Usare JDK 17 completo e Android SDK 36. Eseguire `./gradlew bundleRelease assembleRelease` dalla directory `android`, dopo aver impostato `ANDROID_HOME` o `local.properties`.
Per firmare, impostare privatamente `DLM_KEYSTORE_PATH` e `DLM_KEYSTORE_PASSWORD`; alias `upload`. Non aggiungere chiavi, password o local.properties al repository.
Output: `app/build/outputs/bundle/release/app-release.aab` e `app/build/outputs/apk/release/app-release.apk`.
Non caricare un bundle non firmato. Conservare il backup privato della chiave di caricamento.

## Prima del caricamento/rilascio

1. Verificare che Play Console non abbia già un package o una chiave diversi.
2. Pubblicare e verificare le modifiche web del ramo: il bundle carica il sito ospitato e non incorpora una copia HTML.
3. Creare/configurare il sito radice GitHub Pages `dovelhomessoapp.github.io`, senza spostare il progetto esistente. Pubblicare `.nojekyll` e `.well-known/assetlinks.json` alla radice del dominio, non dentro `/dove-lho-messo/`.
4. Il file `domain-verification/assetlinks.json` contiene il certificato di caricamento, utile per l'APK locale. Aggiungere lo SHA-256 del certificato **firma app** fornito da Google Play App Signing; spesso è diverso da quello di caricamento.
5. Verificare HTTP 200 e JSON corretto su https://dovelhomessoapp.github.io/.well-known/assetlinks.json e associazione senza barra browser con l'app installata da Play.
6. Provare su Android reale: login/conferma/reset, inviti, dati di famiglia, creazione/modifica, foto/galleria, QR/ISBN, PDF, notifiche (incluso avvio a freddo), offline, Premium esistente e assenza di percorsi di acquisto esterni.
7. Solo dopo le verifiche, completare e inviare la release Alpha. Il conteggio dei tester decorre dalle adesioni effettive, non dall'inserimento delle email.

## Verifiche effettuate

- `bundleRelease` e `assembleRelease`: riusciti con firma release.
- Firma AAB e APK verificata; bundletool validate eseguito.
- Controlli JavaScript e test browser: modalità web mantiene i controlli Stripe; modalità Play nasconde gli acquisti e blocca checkout, anche dopo navigazione nella stessa sessione.
- Nessuna operazione sul database, sugli utenti o sugli abbonamenti.
- Corrette due sequenze di newline letterali già presenti in `casa-dolce-casa-photo-ai.js` che impedivano il caricamento del modulo.

## Limiti delle verifiche

Non ancora verificati: installazione su Android reale, certificato Play App Signing, associazione dominio pubblicata, notifiche reali dalla TWA, percorsi autenticati e dispositivi fisici. I test browser non equivalgono a test del pacchetto su telefono. Il bundle è un candidato tecnico, non una release già approvata.
