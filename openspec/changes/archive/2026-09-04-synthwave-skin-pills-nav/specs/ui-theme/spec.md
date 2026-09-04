## ADDED Requirements

### Requirement: Dark synthwave color palette
Il sistema SHALL applicare una palette scura a tema synthwave/Miami anni 80 (sfondo blu notte/viola scuro/nero, accenti neon magenta/ciano/viola/giallo) definita tramite CSS custom properties su `:root`, applicata in modo consistente a tutti i componenti della pagina (header, sezioni, modale, podio, stat card, tabella storico, badge, stati loading/error/success).

#### Scenario: Sfondo pagina in stile synthwave
- **WHEN** la pagina viene caricata
- **THEN** il `body` mostra uno sfondo scuro con gradiente (blu notte/viola/nero) invece del gradiente viola chiaro/bianco precedente

#### Scenario: Palette applicata via variabili CSS
- **WHEN** si ispeziona il foglio di stile della pagina
- **THEN** i colori di sfondo, testo e accento sono definiti come custom properties su `:root` e riutilizzati dai selettori dei singoli componenti, senza valori esadecimali duplicati per lo stesso ruolo cromatico

### Requirement: Neon accent styling on interactive elements
Il sistema SHALL applicare effetti "neon glow" (bordi luminosi, `box-shadow`/`text-shadow` colorati) a elementi interattivi e di enfasi: pulsanti primari (`.btn-new-match`, `.btn-submit`), pill di navigazione attiva, badge vincitore, blocchi del podio, titoli di sezione.

#### Scenario: Glow su pulsante primario
- **WHEN** l'utente visualizza o passa il mouse/focus su un pulsante primario (es. "➕ Nuova Partita")
- **THEN** il pulsante mostra un bordo o un'ombra colorata neon coerente con la palette, distinguibile dallo stato di default

#### Scenario: Titoli di sezione con font display
- **WHEN** l'utente visualizza un heading di sezione (es. "📊 Statistiche")
- **THEN** il testo usa il font display configurato per il tema (con fallback di sistema) invece del font di sistema generico usato per il corpo testo

### Requirement: Readable contrast maintained
Il sistema SHALL mantenere un rapporto di contrasto testo/sfondo conforme a WCAG AA (almeno 4.5:1 per testo normale, 3:1 per testo grande) per tutto il testo informativo (etichette statistiche, celle della tabella storico, hint, messaggi di stato), riservando i colori neon più saturi a elementi grandi o puramente decorativi.

#### Scenario: Testo tabella storico leggibile
- **WHEN** l'utente visualizza una riga della tabella storico partite sullo sfondo scuro
- **THEN** il testo della cella (data, nomi giocatori) è renderizzato in un colore chiaro ad alto contrasto, non in un colore neon saturo a bassa luminanza

#### Scenario: Messaggi di errore e successo distinguibili
- **WHEN** viene mostrato un messaggio `.error` o `.success`
- **THEN** il messaggio resta leggibile sullo sfondo scuro e distinguibile per colore/icona dagli altri stati, mantenendo il contrasto minimo richiesto

### Requirement: Mobile-first responsive layout preserved
Il sistema SHALL mantenere (o migliorare) il comportamento responsive già esistente: nessun overflow orizzontale, componenti utilizzabili da 320px di larghezza in su, breakpoint `max-width: 640px` mantenuto o adattato per i nuovi componenti introdotti dal tema.

#### Scenario: Nessun overflow orizzontale su viewport stretto
- **WHEN** la pagina viene visualizzata su un viewport di 320px di larghezza
- **THEN** nessun elemento (inclusi eventuali pattern di sfondo decorativi) causa scroll orizzontale della pagina

#### Scenario: Componenti esistenti restano fruibili su mobile
- **WHEN** la pagina viene visualizzata su un viewport ≤640px
- **THEN** podio, stat card e tabella storico mantengono le regole di adattamento già presenti (es. stack verticale dei campi del form, dimensioni font ridotte) applicate alla nuova skin
