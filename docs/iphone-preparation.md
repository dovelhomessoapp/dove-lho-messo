# Preparazione iPhone

Questa proposta migliora l'app web esistente; non contiene ancora un progetto Xcode o un archivio iOS distribuibile.

## Correzioni preparate

- Margini per tacca e bordi sicuri in verticale e orizzontale.
- Spazio a fine pagina e posizione di tutorial/notifiche basati sull'altezza effettiva della barra, compreso l'indicatore Home.
- Campi a 16 px sui dispositivi touch per evitare lo zoom durante la compilazione, senza disabilitare lo zoom manuale.
- Tutorial scorrevole anche su schermi bassi.
- Arresto della fotocamera al cambio di app, blocco schermo o uscita dalla pagina. Il ritorno mantiene il pulsante per riaprirla.

Non vengono modificati autenticazione, archivio, dati cloud, prezzi, abbonamenti o notifiche push.

## Verifiche eseguite

- `node --check casa-dolce-casa.js`
- `node checks/distribution.cjs`: 7 scenari di distribuzione esistenti.
- `node checks/iphone.cjs`: ricalcolo barra e fallback senza ResizeObserver; eventi di background; presenza delle protezioni di layout.
- `git diff --check`.

Verifica WebKit completata su Mac remoto GitHub Actions: 7 sezioni su viewport 375×667, 390×844 e 844×390; controlli su overflow orizzontale, barra inferiore, spazio finale e dimensione dei campi editabili tutti superati. Run: https://github.com/dovelhomessoapp/dove-lho-messo/actions/runs/41778930847. La prima esecuzione aveva rilevato che la condizione CSS specifica di iOS non si attivava in WebKit desktop; ora la regola dipende dalle capacità touch. Checkbox e altri controlli non editabili sono esclusi dalla verifica del testo.

Questi controlli misurano il layout in emulazione; non sostituiscono una revisione visiva o prove reali di tastiera, tacca, fotocamera, permessi e firma iOS.

## Prossima verifica sul Mac/iPhone

1. Identificare versione macOS e versione Xcode compatibile prima di scegliere la versione della piattaforma iOS.
2. Aprire l'app su iPhone piccolo e con tacca, anche in orizzontale: Home, inserimento oggetto/libro, dispensa, tutorial, ultimo pulsante del modulo.
3. Aprire tastiera nei moduli, scrivere, chiuderla e controllare navigazione e salvataggio.
4. Provare foto e scansione, rifiuto permesso, cambio app, blocco schermo e riapertura lettore.
5. Preparare il contenitore iOS con risorse locali, permessi fotocamera, icone, autenticazione e ritorni da link. Non assumere che l'installazione web già provata equivalga alla build iOS.
6. Definire notifiche per la build iOS: non assumere che le attuali Web Push funzionino nel contenitore.
7. Definire il percorso acquisti per App Store prima di esporre il checkout Stripe nella build iOS; verificare le regole applicabili e la gestione degli abbonamenti già esistenti.
8. Con iscrizione Apple attiva: firma, prova su dispositivo, caricamento e test della build tramite TestFlight.
