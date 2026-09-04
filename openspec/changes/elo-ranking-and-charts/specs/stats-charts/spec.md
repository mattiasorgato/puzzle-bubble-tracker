## ADDED Requirements

### Requirement: Charts section with three visualizations
Il sistema SHALL fornire una sezione "Grafici" contenente tre grafici calcolati dallo storico partite: andamento della posizione in classifica nel tempo, partite giocate per giocatore, e vittorie per giorno.

#### Scenario: I tre grafici sono presenti
- **WHEN** l'utente apre la sezione "Grafici" con dati caricati
- **THEN** vede il grafico dell'andamento classifica, quello delle partite giocate per giocatore e quello delle vittorie per giorno, ciascuno con il proprio titolo

#### Scenario: Grafici aggiornati insieme al resto della pagina
- **WHEN** viene salvata una nuova partita o l'auto-refresh porta dati aggiornati
- **THEN** i tre grafici riflettono i nuovi dati senza richiedere un reload della pagina

### Requirement: Rank history chart
Il sistema SHALL rappresentare l'andamento della classifica come grafico a linee con una linea per giocatore, asse X per giornata di gioco e asse Y sulla posizione in classifica con la prima posizione in alto.

#### Scenario: Prima posizione in alto
- **WHEN** un giocatore passa dalla terza alla prima posizione
- **THEN** la sua linea sale visivamente verso l'alto nel grafico

#### Scenario: Legenda con i nomi dei giocatori
- **WHEN** l'utente visualizza il grafico dell'andamento
- **THEN** una legenda associa ogni colore di linea al nome del giocatore corrispondente

### Requirement: Games played chart
Il sistema SHALL rappresentare le partite giocate come grafico a barre orizzontali, una barra per giocatore, ordinate per numero di partite decrescente e con il valore numerico leggibile accanto a ciascuna barra.

#### Scenario: Ordinamento per numero di partite
- **WHEN** tre giocatori hanno giocato rispettivamente 24, 18 e 12 partite
- **THEN** le barre compaiono nell'ordine 24, 18, 12 dall'alto verso il basso, ciascuna con il proprio valore indicato

### Requirement: Wins per day chart
Il sistema SHALL rappresentare le vittorie per giorno come grafico a barre verticali in ordine cronologico, dove l'altezza di ogni barra è il numero di partite giocate quel giorno e i segmenti impilati rappresentano i vincitori, usando gli stessi colori della legenda condivisa.

#### Scenario: Barra suddivisa per vincitore
- **WHEN** in una giornata si sono giocate 4 partite vinte da due giocatori diversi
- **THEN** la barra di quella giornata ha altezza pari a 4 ed è divisa nei segmenti dei due vincitori, ciascuno nel colore associato al giocatore

#### Scenario: Giornate senza partite non generano barre
- **WHEN** tra due giornate di gioco intercorre una settimana senza partite
- **THEN** il grafico non mostra barre a zero per i giorni intermedi, mantenendo comunque l'ordine cronologico delle giornate rappresentate

### Requirement: Stable per-player colors shared across charts
Il sistema SHALL assegnare a ogni giocatore un colore preso da una palette categorica a ordine fisso, in base alla sua posizione nell'elenco ordinato dei giocatori, e SHALL usare lo stesso colore per quel giocatore in tutti i grafici che lo rappresentano. Il sistema SHALL NOT riciclare i colori della palette quando i giocatori superano gli slot disponibili.

#### Scenario: Stesso colore in grafici diversi
- **WHEN** un giocatore compare sia nel grafico dell'andamento classifica sia nei segmenti delle vittorie per giorno
- **THEN** è rappresentato dallo stesso colore in entrambi

#### Scenario: Colori stabili tra un refresh e l'altro
- **WHEN** l'auto-refresh ricarica i dati senza che sia entrato in classifica un nuovo giocatore
- **THEN** i colori assegnati ai giocatori restano identici a prima del refresh

#### Scenario: Più giocatori degli slot disponibili
- **WHEN** i giocatori in classifica superano il numero di slot della palette
- **THEN** i giocatori in eccedenza usano un colore neutro condiviso invece di riusare una tinta già assegnata, e il grafico dell'andamento si limita ai primi giocatori in classifica

### Requirement: Charts empty and loading states
Il sistema SHALL mostrare uno stato di caricamento nella sezione grafici finché i dati non sono disponibili, e un messaggio esplicito al posto dei grafici quando lo storico non contiene partite sufficienti a rappresentarli.

#### Scenario: Nessuna partita registrata
- **WHEN** l'utente apre la sezione "Grafici" e lo storico è vuoto
- **THEN** vede un messaggio che indica l'assenza di dati, senza assi vuoti né errori in console

### Requirement: Charts readable on narrow viewports
Il sistema SHALL rendere i grafici in SVG scalabile che si adatta alla larghezza disponibile, restando leggibile da 320px di larghezza in su senza generare scroll orizzontale della pagina.

#### Scenario: Grafici su viewport stretto
- **WHEN** la sezione "Grafici" viene visualizzata su un viewport di 320px di larghezza
- **THEN** i tre grafici sono interamente visibili nella larghezza del contenitore, con etichette leggibili e senza scroll orizzontale della pagina
