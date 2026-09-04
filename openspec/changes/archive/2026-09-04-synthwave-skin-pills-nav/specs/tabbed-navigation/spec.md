## ADDED Requirements

### Requirement: Pills navigation switches between sections
Il sistema SHALL fornire un menu di navigazione a forma di pill con due opzioni ("📊 Statistiche" e "📝 Storico") che, al click/tap, mostra la sezione corrispondente e nasconde l'altra, sostituendo l'attuale visualizzazione impilata delle due sezioni.

#### Scenario: Click su una pill mostra la sezione corrispondente
- **WHEN** l'utente clicca sulla pill "📝 Storico" mentre è attiva "📊 Statistiche"
- **THEN** la sezione storico partite diventa visibile e la sezione statistiche viene nascosta

#### Scenario: Solo una sezione visibile per volta
- **WHEN** la pagina è in un qualsiasi stato dopo il caricamento iniziale
- **THEN** esattamente una tra le sezioni "Statistiche" e "Storico" è visibile nel DOM (l'altra ha l'attributo `hidden`)

### Requirement: Default active tab on load
Il sistema SHALL mostrare la sezione "Statistiche" come tab attiva di default al caricamento della pagina, senza persistere la scelta tra un reload e l'altro.

#### Scenario: Stato iniziale al caricamento
- **WHEN** la pagina viene caricata per la prima volta (o ricaricata)
- **THEN** la sezione "Statistiche" è visibile e la relativa pill risulta marcata come attiva, indipendentemente da eventuali interazioni di una sessione precedente

### Requirement: Accessible tab semantics
Il sistema SHALL implementare la nav a pills con semantica ARIA da tab (`role="tablist"` sul contenitore, `role="tab"` con `aria-selected` sulle pill, `role="tabpanel"` sulle sezioni collegate tramite `aria-controls`/`aria-labelledby`), aggiornando `aria-selected` e lo stato visivo attivo ad ogni cambio tab.

#### Scenario: Attributo aria-selected aggiornato al cambio tab
- **WHEN** l'utente attiva la pill "Storico"
- **THEN** la pill "Storico" ha `aria-selected="true"` e la pill "Statistiche" ha `aria-selected="false"`

#### Scenario: Navigazione da tastiera
- **WHEN** l'utente naviga con Tab fino a una pill e preme Invio o Spazio
- **THEN** la sezione corrispondente viene attivata allo stesso modo di un click/tap, senza richiedere il mouse

### Requirement: Mobile-first full-width pills without overflow
Il sistema SHALL disporre le pill di navigazione in modo che occupino la larghezza disponibile in colonne uguali su viewport stretti, senza generare scroll orizzontale, restando usabili da 320px di larghezza in su.

#### Scenario: Pills leggibili e senza overflow su viewport stretto
- **WHEN** la pagina viene visualizzata su un viewport di 320px di larghezza
- **THEN** le due pill sono entrambe visibili affiancate (o adattate) senza causare scroll orizzontale della pagina e restano interamente cliccabili/tappabili

### Requirement: New match action independent of tabs
Il sistema SHALL mantenere il pulsante "➕ Nuova Partita" e il relativo modale come azione indipendente dalla nav a pills: l'apertura del modale non deve dipendere dalla tab attualmente attiva, né esserne influenzata.

#### Scenario: Apertura modale da qualsiasi tab attiva
- **WHEN** l'utente clicca "➕ Nuova Partita" mentre la tab "Storico" è attiva
- **THEN** il modale di inserimento nuova partita si apre normalmente e, alla chiusura, la tab "Storico" resta quella attiva
