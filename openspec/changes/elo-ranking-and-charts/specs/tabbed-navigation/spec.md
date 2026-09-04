## MODIFIED Requirements

### Requirement: Pills navigation switches between sections
Il sistema SHALL fornire un menu di navigazione a forma di pill con tre opzioni ("📊 Statistiche", "📝 Storico" e "📈 Grafici") che, al click/tap, mostra la sezione corrispondente e nasconde le altre.

#### Scenario: Click su una pill mostra la sezione corrispondente
- **WHEN** l'utente clicca sulla pill "📝 Storico" mentre è attiva "📊 Statistiche"
- **THEN** la sezione storico partite diventa visibile e la sezione statistiche viene nascosta

#### Scenario: Click sulla pill Grafici
- **WHEN** l'utente clicca sulla pill "📈 Grafici" da una qualsiasi altra tab
- **THEN** la sezione grafici diventa visibile e la sezione precedentemente attiva viene nascosta

#### Scenario: Solo una sezione visibile per volta
- **WHEN** la pagina è in un qualsiasi stato dopo il caricamento iniziale
- **THEN** esattamente una tra le sezioni "Statistiche", "Storico" e "Grafici" è visibile nel DOM (le altre hanno l'attributo `hidden`)

### Requirement: Mobile-first full-width pills without overflow
Il sistema SHALL disporre le tre pill di navigazione in modo che occupino la larghezza disponibile in colonne uguali su viewport stretti, senza generare scroll orizzontale, restando usabili da 320px di larghezza in su.

#### Scenario: Pills leggibili e senza overflow su viewport stretto
- **WHEN** la pagina viene visualizzata su un viewport di 320px di larghezza
- **THEN** le tre pill sono tutte visibili e interamente cliccabili/tappabili, senza causare scroll orizzontale della pagina
