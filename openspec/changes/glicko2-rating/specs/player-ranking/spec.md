## MODIFIED Requirements

### Requirement: Elo rating replaces win rate as ranking metric
Il sistema SHALL calcolare per ogni giocatore un rating Glicko-2 (r, RD, volatilità σ; partenza 1000 / 350 / 0,06; τ 0,5; tetto RD 350) replicando l'intero storico a ogni render, con periodo di rating pari alla giornata attiva nel fuso `Europe/Rome`, e SHALL usare il punteggio prudente `r − 2·RD` come metrica di ordinamento e come valore mostrato su podio e stat card, etichettato "Rating".

#### Scenario: Poche partite fortunate non bastano
- **WHEN** un giocatore ha un record di 2-0 e un altro ha 51-42
- **THEN** il giocatore 2-0 ha una RD alta, quindi un punteggio prudente basso, e compare dietro al giocatore con storico consolidato

#### Scenario: L'ordine delle partite del giorno non conta
- **WHEN** le partite di una stessa giornata sono registrate in un ordine qualunque
- **THEN** gli stati finali di tutti i giocatori sono identici, perché ogni partita usa i rating di inizio giornata

#### Scenario: Inattività
- **WHEN** un giocatore che ha già giocato salta una o più giornate attive
- **THEN** la sua RD cresce secondo `√(φ² + n·σ²)` fino al tetto di 350, r e σ restano invariati e il suo punteggio prudente scende

#### Scenario: Giorni senza partite
- **WHEN** in un giorno di calendario nessuno gioca (weekend, ferie)
- **THEN** quel giorno non è un periodo e non fa crescere la RD di nessuno

#### Scenario: Giocatore provvisorio
- **WHEN** la RD di un giocatore è maggiore di 150
- **THEN** podio e stat card mostrano un badge "Provvisorio", e il giocatore resta in classifica

### Requirement: Deterministic total ordering of the ranking
Il sistema SHALL ordinare la classifica per punteggio prudente decrescente e, a parità, per numero di partite giocate, poi ordine alfabetico del nome, in modo che l'ordine risultante sia completamente determinato dai dati.

#### Scenario: Nessuno scambio di posizioni durante l'auto-refresh
- **WHEN** l'auto-refresh ricarica gli stessi identici dati mentre due giocatori hanno punteggio uguale
- **THEN** le loro posizioni relative sul podio e nelle stat card restano invariate tra un refresh e l'altro

## ADDED Requirements

### Requirement: Classic Elo view
Il sistema SHALL offrire, in cima alla sezione Statistiche, un selettore tra "Rating" (Glicko-2) ed "Elo classico" (partenza 1000, K 24, a somma zero, replay nell'ordine canonico delle partite), e SHALL applicare la scelta solo alle stat card; il podio compare solo nella vista "Rating".

#### Scenario: Vista iniziale
- **WHEN** l'utente apre la pagina
- **THEN** il selettore è su "Rating" e podio e stat card mostrano il punteggio prudente

#### Scenario: Passaggio all'Elo classico
- **WHEN** l'utente sceglie "Elo classico"
- **THEN** il podio non viene mostrato, e le stat card sono ordinate per Elo (poi vittorie, partite, nome) e mostrano `N Elo`, senza `r ± RD` né badge "Provvisorio", con una riga che spiega il sistema

#### Scenario: Il resto della pagina resta sul Rating
- **WHEN** è attiva la vista "Elo classico"
- **THEN** storico e grafici continuano a usare il Rating

### Requirement: Rating details and per-player deltas
Il sistema SHALL mostrare su ogni stat card `r ± RD` e una breve spiegazione del rating (stima prudente che sale man mano che il sistema è più sicuro, e scende piano se si smette di giocare), e SHALL mostrare nello storico, accanto a ciascun giocatore, la variazione del suo punteggio prudente dovuta a quella partita.

#### Scenario: Delta diversi per i due giocatori
- **WHEN** l'utente guarda una partita nello storico
- **THEN** i due giocatori mostrano ciascuno il proprio delta, che in generale non è lo stesso numero con segno opposto

#### Scenario: Somma dei delta di una giornata
- **WHEN** un giocatore ha giocato più partite nella stessa giornata
- **THEN** la somma dei suoi delta di quella giornata è pari alla differenza tra il suo punteggio di fine giornata e quello di fine della giornata attiva precedente
