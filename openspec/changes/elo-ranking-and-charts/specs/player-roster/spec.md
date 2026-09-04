## ADDED Requirements

### Requirement: Roster comes from the Leaderboard sheet
Il sistema SHALL usare come elenco dei giocatori selezionabili la rosa esposta dal foglio (tab "Leaderboard"), non i nomi dedotti dal match log, quando l'endpoint la fornisce.

#### Scenario: Rosa letta dal foglio
- **WHEN** l'endpoint restituisce un elenco `players`
- **THEN** le tendine di "Nuova Partita" propongono quei nomi, compresi quelli che non hanno ancora giocato alcuna partita

#### Scenario: Nessun giocatore perso
- **WHEN** un giocatore compare nel match log ma non nella Leaderboard (rimosso dalla lista, o partita inserita a mano)
- **THEN** resta comunque in classifica e nelle statistiche con le sue partite, invece di sparire insieme ad esse

#### Scenario: Endpoint senza rosa
- **WHEN** l'endpoint non restituisce alcun elenco `players` (Apps Script non ancora aggiornato)
- **THEN** la rosa viene dedotta dal match log come prima, e la pagina resta pienamente funzionante

### Requirement: Players without matches stay out of the standings
Il sistema SHALL escludere dalla classifica, dai grafici e dall'assegnazione dei colori i giocatori in rosa che non hanno ancora giocato, segnalandoli separatamente.

#### Scenario: Iscritto senza partite
- **WHEN** un giocatore è in Leaderboard ma non ha partite giocate
- **THEN** non compare in classifica né come serie nei grafici — un rating di partenza non è un risultato — ma è selezionabile in una nuova partita ed è elencato sotto le stat card come in attesa della prima partita

### Requirement: Add a player from the app
Il sistema SHALL permettere di aggiungere un giocatore alla Leaderboard dalla pagina, rifiutando nomi vuoti e duplicati.

#### Scenario: Aggiunta riuscita
- **WHEN** l'utente inserisce un nome nuovo e conferma
- **THEN** il nome viene scritto nella Leaderboard del foglio e diventa immediatamente selezionabile in una nuova partita, senza ricaricare la pagina

#### Scenario: Nome duplicato
- **WHEN** l'utente inserisce un nome già presente, anche con maiuscole o spazi diversi
- **THEN** l'aggiunta viene rifiutata con un messaggio che indica il nome già in lista, e nel foglio non viene scritta alcuna riga

#### Scenario: Backend non aggiornato
- **WHEN** l'utente apre il comando di aggiunta mentre l'Apps Script collegato non espone la rosa
- **THEN** il comando resta visibile ma non apre il form, spiegando che serve aggiornare lo script del foglio — nessuna richiesta viene inviata, perché lo script vecchio la scriverebbe come se fosse una partita
