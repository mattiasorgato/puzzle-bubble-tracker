## ADDED Requirements

### Requirement: Rating history chart
Il grafico dell'andamento del rating SHALL chiamarsi "Andamento Rating" e SHALL tracciare, per ogni giornata attiva, il punteggio prudente `r − 2·RD` di ciascun giocatore a fine giornata.

#### Scenario: Valore mostrato nel tooltip
- **WHEN** l'utente passa sopra un punto del grafico
- **THEN** il valore è il punteggio prudente arrotondato all'intero, seguito da "Rating"
