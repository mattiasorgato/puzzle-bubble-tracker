## MODIFIED Requirements

### Requirement: Neon accent styling on interactive elements
Il sistema SHALL applicare effetti "neon glow" (bordi luminosi, `box-shadow`/`text-shadow` colorati) a elementi interattivi e di enfasi: pulsanti primari (`.btn-new-match`, `.btn-submit`), pill di navigazione attiva, nome del vincitore nella tabella storico, blocchi del podio, titoli di sezione.

#### Scenario: Glow su pulsante primario
- **WHEN** l'utente visualizza o passa il mouse/focus su un pulsante primario (es. "➕ Nuova Partita")
- **THEN** il pulsante mostra un bordo o un'ombra colorata neon coerente con la palette, distinguibile dallo stato di default

#### Scenario: Titoli di sezione con font display
- **WHEN** l'utente visualizza un heading di sezione (es. "📊 Statistiche")
- **THEN** il testo usa il font display configurato per il tema (con fallback di sistema) invece del font di sistema generico usato per il corpo testo

#### Scenario: Vincitore evidenziato nella tabella storico
- **WHEN** l'utente visualizza una riga della tabella storico
- **THEN** il nome del vincitore è preceduto da una corona ed è distinguibile dall'altro giocatore per trattamento tipografico/cromatico coerente con la palette neon, senza che esista una colonna "Vincitore" separata

### Requirement: Readable contrast maintained
Il sistema SHALL mantenere un rapporto di contrasto testo/sfondo conforme a WCAG AA (almeno 4.5:1 per testo normale, 3:1 per testo grande) per tutto il testo informativo (etichette statistiche, celle della tabella storico, etichette e legende dei grafici, hint, messaggi di stato), riservando i colori neon più saturi a elementi grandi o puramente decorativi.

#### Scenario: Testo tabella storico leggibile
- **WHEN** l'utente visualizza una riga della tabella storico partite sullo sfondo scuro
- **THEN** il testo della cella (data, nomi giocatori) è renderizzato in un colore chiaro ad alto contrasto, non in un colore neon saturo a bassa luminanza

#### Scenario: Messaggi di errore e successo distinguibili
- **WHEN** viene mostrato un messaggio `.error` o `.success`
- **THEN** il messaggio resta leggibile sullo sfondo scuro e distinguibile per colore/icona dagli altri stati, mantenendo il contrasto minimo richiesto

#### Scenario: Etichette dei grafici leggibili
- **WHEN** l'utente visualizza le etichette degli assi e la legenda nella sezione "Grafici"
- **THEN** il testo è renderizzato in un colore ad alto contrasto sullo sfondo scuro del pannello, non nei colori di serie usati per linee e barre

### Requirement: Mobile-first responsive layout preserved
Il sistema SHALL mantenere (o migliorare) il comportamento responsive già esistente: nessun overflow orizzontale, componenti utilizzabili da 320px di larghezza in su, breakpoint `max-width: 640px` mantenuto o adattato per i nuovi componenti introdotti (grafici inclusi).

#### Scenario: Nessun overflow orizzontale su viewport stretto
- **WHEN** la pagina viene visualizzata su un viewport di 320px di larghezza
- **THEN** nessun elemento (inclusi pattern di sfondo decorativi e grafici SVG) causa scroll orizzontale della pagina

#### Scenario: Componenti esistenti restano fruibili su mobile
- **WHEN** la pagina viene visualizzata su un viewport ≤640px
- **THEN** podio e tabella storico mantengono le regole di adattamento già presenti (es. stack verticale dei campi del form, dimensioni font ridotte) applicate alla nuova skin

### Requirement: Stat cards as single-line rows on mobile
Il sistema SHALL disporre le stat card, su viewport ≤640px, come una riga per giocatore che occupa la larghezza disponibile — posizione, nome, record e rating affiancati — mantenendo ogni riga su una sola linea di testo.

#### Scenario: Una riga per giocatore
- **WHEN** la sezione statistiche viene visualizzata su un viewport di 320px
- **THEN** ogni giocatore occupa una singola riga con posizione, nome, record W-L e rating affiancati, e tutte le righe hanno la stessa altezza

#### Scenario: Nome troppo lungo troncato
- **WHEN** il nome di un giocatore non entra nello spazio disponibile della riga
- **THEN** viene troncato con i puntini di sospensione invece di andare a capo, e il nome completo resta disponibile come tooltip della card

#### Scenario: Etichetta del record accessibile anche quando non visibile
- **WHEN** la riga compatta nasconde l'etichetta "W-L Record" per far spazio al nome
- **THEN** l'etichetta resta nel DOM e leggibile da uno screen reader, invece di essere rimossa
