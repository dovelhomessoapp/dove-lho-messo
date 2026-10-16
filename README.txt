DOVE L’HO MESSO? — PROTOTIPO 0.1

CONTENUTO: prima web app installabile (PWA), con inserimento e ricerca oggetti/libri, foto, posizioni e QR offline, ricerca ISBN Open Library online.

PROVA SU COMPUTER: aprire index.html nel browser. La funzione di stampa QR richiede l’autorizzazione ai popup.

PROVA SU IPHONE/ANDROID: pubblicare tutti questi file gratuitamente su un host HTTPS statico (per esempio GitHub Pages o Netlify). Aprire l’indirizzo HTTPS sul telefono; su iPhone Safari > Condividi > Aggiungi alla schermata Home; su Android Chrome > Installa app / Aggiungi a schermata Home. Il primo caricamento deve essere online, poi le schermate principali funzionano offline.

ATTENZIONE: gli archivi sono LOCALI AL SINGOLO BROWSER E DISPOSITIVO e NON sincronizzati. Evitare dati importanti: il browser può cancellarli. In questa versione non esiste ancora backup/esportazione. Foto compresse per risparmiare spazio. In navigazione privata i dati possono sparire.

SCANSIONE: lettura automatica con fotocamera solo se il browser supporta BarcodeDetector, con HTTPS e permesso fotocamera. Altrimenti inserire manualmente il codice stampato sotto il QR. Su molti iPhone la scansione automatica di questa versione può non essere disponibile.

ISBN: cercare tramite Open Library richiede Internet; la copertina non viene importata. Valutazione AI, login, sincronizzazione e pagamento Plus NON sono implementati.

LICENZA QR: libreria QR derivata dal progetto QRCode for JavaScript di Kazuhiko Arase (MIT).
