## ADDED Requirements

### Requirement: Elo rating replaces win rate as ranking metric
Il sistema SHALL calcolare per ogni giocatore un rating Elo (partenza 1000, fattore K 24, attesa `1 / (1 + 10^((R_avversario - R_giocatore) / 400))`) replicando l'intero storico partite nell'ordine in cui le righe sono restituite dal foglio, e SHALL usare tale rating — non la percentuale di vittorie — come metrica di ordinamento e come valore mostrato su podio e stat card.

#### Scenario: Podio ordinato per rating e non per percentuale
- **WHEN** un giocatore con 1 vittoria su 1 partita (100% win) e un giocatore con 18 vittorie su 22 partite sono entrambi in classifica
- **THEN** il giocatore con 18-4 compare in posizione migliore, perché il suo rating Elo è più alto di quello di chi ha giocato una sola partita

#### Scenario: Rating mostrato al posto della percentuale
- **WHEN** l'utente visualizza il podio o una stat card
- **THEN** il numero mostrato come metrica di classifica è il rating Elo arrotondato all'intero, e la percentuale di vittorie non compare più

#### Scenario: Battere un avversario forte vale più che batterne uno debole
- **WHEN** due giocatori con lo stesso rating vincono una partita ciascuno, uno contro un avversario con rating più alto del proprio e uno contro un avversario con rating più basso
- **THEN** il giocatore che ha battuto l'avversario più forte guadagna più punti rating dell'altro

#### Scenario: Nessuna soglia di partite minime
- **WHEN** un giocatore ha giocato una sola partita
- **THEN** compare comunque in classifica con il proprio rating, senza essere escluso e senza poter scavalcare per effetto di una sola vittoria i giocatori con uno storico consolidato

### Requirement: Deterministic total ordering of the ranking
Il sistema SHALL ordinare la classifica per rating Elo decrescente e, a parità di rating, per numero di vittorie, poi partite giocate, poi ordine alfabetico del nome, in modo che l'ordine risultante sia completamente determinato dai dati.

#### Scenario: Nessuno scambio di posizioni durante l'auto-refresh
- **WHEN** l'auto-refresh a 10 secondi ricarica gli stessi identici dati mentre due giocatori hanno rating uguale
- **THEN** le loro posizioni relative sul podio e nelle stat card restano invariate tra un refresh e l'altro

### Requirement: Stat cards ordered by ranking
Il sistema SHALL disporre le stat card nello stesso ordine della classifica (non in ordine alfabetico) e SHALL mostrare su ogni card la posizione occupata.

#### Scenario: Griglia coerente con il podio
- **WHEN** l'utente guarda la sezione statistiche
- **THEN** la prima stat card è quella del giocatore in vetta, marcata `#1`, e le successive seguono l'ordine della classifica, indipendentemente dall'ordine alfabetico dei nomi

### Requirement: Days at the top displayed under the leader's name
Il sistema SHALL calcolare da quanti giorni consecutivi il giocatore attualmente primo in classifica occupa la vetta — ricostruendo la classifica alla fine di ogni giornata di gioco e risalendo indietro finché il leader resta lo stesso — e SHALL mostrare tale valore sotto il nome del primo classificato sul podio.

#### Scenario: Permanenza mostrata sul primo posto
- **WHEN** il giocatore in prima posizione ha la vetta dalla giornata di 12 giorni fa
- **THEN** sotto il suo nome sul podio compare l'indicazione della permanenza (es. `👑 12 giorni`), mostrata solo sul primo posto e non su secondo e terzo

#### Scenario: I giorni senza partite contano nella permanenza
- **WHEN** il leader ha preso la vetta 10 giorni fa e da allora non è stata giocata alcuna partita
- **THEN** la permanenza indicata è di 10 giorni, non azzerata né limitata alle sole giornate con partite giocate

#### Scenario: Cambio di leader azzera il conteggio
- **WHEN** una nuova partita porta in vetta un giocatore diverso da quello del giorno precedente
- **THEN** la permanenza mostrata riparte dal nuovo leader, con un valore minimo di 1 giorno

#### Scenario: Storico troppo breve
- **WHEN** esiste una sola giornata di partite nello storico
- **THEN** il podio mostra comunque il leader con una permanenza di 1 giorno, senza errori né valori vuoti
