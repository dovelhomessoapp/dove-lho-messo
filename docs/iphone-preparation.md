# Preparazione iPhone

Questa proposta migliora l'app web esistente; non contiene ancora un progetto Xcode o un archivio iOS distribuibile.

## Correzioni preparate

- Margini per tacca e bordi sicuri in verticale e orizzontale.
- Spazio a fine pagina e posizione di tutorial/notifiche basati sull'altezza effettiva della barra, compreso l'indicatore Home.
- Campi a 16 px su iOS per evitare lo zoom durante la compilazione, senza disabilitare lo zoom manuale.
- Tutorial scorrevole anche su schermi bassi.
- Arresto della fotocamera al cambio di app, blocco schermo o uscita dalla pagina. Il ritorno mantiene il pulsante per riaprirla.

Non vengono modificati autenticazione, archivio, dati cloud, prezzi, abbonamenti o notifiche push.

## Verifiche eseguite

- `node --check casa-dolce-casa.js`
- `node checks/distribution.cjs`: 7 scenari di distribuzione esistenti.
- `node checks/iphone.cjs`: ricalcolo barra e fallback senza ResizeObserver; eventi di background; presenza delle protezioni di layout.
- `git diff --check`.

La verifica visiva WebKit non è stata eseguita: il browser scaricato non può avviarsi perché mancano librerie di sistema. I test isolati non simulano tastiera, tacca o permessi reali.

## Prossima verifica sul Mac/iPhone

1. Identificare versione macOS e versione Xcode compatibile prima di scegliere la versione della piattaforma iOS.
2. Aprire l'app su iPhone piccolo e con tacca, anche in orizzontale: Home, inserimento oggetto/libro, dispensa, tutorial, ultimo pulsante del modulo.
3. Aprire tastiera nei moduli, scrivere, chiuderla e controllare navigazione e salvataggio.
4. Provare foto e scansione, rifiuto permesso, cambio app, blocco schermo e riapertura lettore.
5. Preparare il contenitore iOS con risorse locali, permessi fotocamera, icone, autenticazione e ritorni da link. Non assumere che l'installazione web già provata equivalga alla build iOS.
6. Definire notifiche per la build iOS: non assumere che le attuali Web Push funzionino nel contenitore.
7. Definire il percorso acquisti per App Store prima di esporre il checkout Stripe nella build iOS; verificare le regole applicabili e la gestione degli abbonamenti già esistenti.
8. Con iscrizione Apple attiva: firma, prova su dispositivo, caricamento e test della build tramite TestFlight.
