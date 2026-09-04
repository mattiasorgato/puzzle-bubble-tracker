## ADDED Requirements

### Requirement: One carousel per chart family
Il sistema SHALL organizzare la sezione "Grafici" in due caroselli distinti, impilati verticalmente, uno per famiglia: "Classifica" (andamento classifica, andamento ELO, andamento win rate) e "Partite" (presenze per giorno e vittorie per giorno). Dentro un carosello si scorre da un grafico all'altro; i due caroselli sono indipendenti e i grafici di uno stesso carosello hanno tutti la stessa forma.

#### Scenario: Due caroselli, cinque grafici
- **WHEN** l'utente apre la sezione "Grafici" con dati caricati
- **THEN** vede il carosello "Classifica" con tre grafici e, sotto, il carosello "Partite" con due, mostrando un grafico per carosello alla volta

#### Scenario: Grafici omogenei dentro un carosello
- **WHEN** l'utente scorre i grafici di un carosello
- **THEN** passa da un grafico all'altro della stessa forma (tutte linee, oppure tutte barre impilate), cambiando il dato e non il modo di leggerlo

#### Scenario: Caroselli indipendenti
- **WHEN** l'utente scorre il carosello "Classifica"
- **THEN** la posizione del carosello "Partite" resta quella che era

#### Scenario: Navigazione
- **WHEN** l'utente usa le frecce, i puntini, lo swipe o il trascinamento col mouse
- **THEN** il carosello passa al grafico corrispondente e i puntini indicano quello visibile

#### Scenario: I caroselli girano in tondo
- **WHEN** l'utente preme "avanti" sull'ultimo grafico di un carosello, o "indietro" sul primo
- **THEN** arriva rispettivamente al primo e all'ultimo, e nessuna freccia risulta mai disabilitata

#### Scenario: Il trascinamento si aggancia a un grafico intero
- **WHEN** l'utente trascina il carosello e rilascia a metà strada tra due grafici
- **THEN** il carosello si aggancia al grafico più vicino, senza restare fermo in mezzo

#### Scenario: Un click fermo non è un trascinamento
- **WHEN** l'utente preme e rilascia senza spostare il puntatore
- **THEN** il carosello non cambia grafico

#### Scenario: Il grafico guardato sopravvive all'auto-refresh
- **WHEN** l'auto-refresh a 10 secondi rigenera i grafici mentre l'utente ne sta guardando uno diverso dal primo
- **THEN** alla fine dell'aggiornamento resta visibile lo stesso grafico, in entrambi i caroselli

### Requirement: Elo and win rate trends
Il sistema SHALL fornire, accanto all'andamento della posizione, un andamento del rating Elo e un andamento della percentuale di vittorie cumulata, con la stessa struttura del primo (una linea per giocatore, asse X per giornata).

#### Scenario: Andamento del rating
- **WHEN** un giocatore guadagna punti rating nel tempo
- **THEN** la sua linea nel grafico ELO sale, con l'asse Y sui valori di rating e non sulle posizioni

#### Scenario: L'asse contiene il valore più alto
- **WHEN** il rating più alto non coincide con una tacca dell'asse (es. 1094 con tacche ogni 50)
- **THEN** l'asse si estende alla tacca successiva (1100), così che il punto più alto resti dentro l'area del grafico invece di finirne fuori

#### Scenario: Il win rate è cumulato
- **WHEN** un giocatore vince la prima partita e perde la seconda, in due giornate diverse
- **THEN** il suo andamento win rate segna 100% alla prima giornata e 50% alla seconda

#### Scenario: Grafici aggiornati insieme al resto della pagina
- **WHEN** viene salvata una nuova partita o l'auto-refresh porta dati aggiornati
- **THEN** i grafici riflettono i nuovi dati senza richiedere un reload della pagina

### Requirement: Rank history chart
Il sistema SHALL rappresentare l'andamento della classifica come grafico a linee con una linea per **ogni** giocatore in classifica, asse X per giornata di gioco e asse Y sulla posizione in classifica con la prima posizione in alto.

#### Scenario: Prima posizione in alto
- **WHEN** un giocatore passa dalla terza alla prima posizione
- **THEN** la sua linea sale visivamente verso l'alto nel grafico

#### Scenario: Nessun giocatore escluso dal grafico
- **WHEN** in classifica ci sono più giocatori dei colori disponibili nella palette
- **THEN** ogni giocatore ha comunque la propria linea nel grafico, e la legenda non elenca nomi che il grafico non disegna

#### Scenario: Legenda con i nomi dei giocatori
- **WHEN** l'utente visualizza il grafico dell'andamento
- **THEN** una legenda associa ogni colore di linea al nome del giocatore corrispondente

### Requirement: Line identity not carried by color alone
Il sistema SHALL identificare ogni linea del grafico dell'andamento con il nome del giocatore scritto in corrispondenza del suo ultimo punto e con un tratteggio proprio, in modo che due linee restino distinguibili anche quando i rispettivi colori non lo sono.

#### Scenario: Ogni linea porta il proprio nome
- **WHEN** l'utente visualizza il grafico dell'andamento con un numero qualsiasi di giocatori
- **THEN** ogni linea ha il nome del giocatore stampato alla sua estremità destra, troncato con ellissi se non ci sta, con il nome completo disponibile come tooltip

#### Scenario: Etichette mai sovrapposte
- **WHEN** due giocatori hanno valori quasi identici, e quindi le loro linee finiscono alla stessa altezza
- **THEN** le rispettive etichette vengono distanziate mantenendo l'ordine verticale, e un trattino collega ciascuna etichetta spostata al proprio punto

#### Scenario: Colori simili restano distinguibili
- **WHEN** due giocatori hanno colori di serie che una carenza cromatica rende quasi identici
- **THEN** le due linee restano attribuibili grazie all'etichetta e al tratteggio, senza dipendere dal colore

### Requirement: Presence per day chart
Il sistema SHALL rappresentare le presenze come grafico a barre verticali impilate per giornata, dove ogni partita accredita entrambi i giocatori, con la stessa forma, la stessa scala e gli stessi colori del grafico delle vittorie per giorno.

#### Scenario: Ogni partita conta per entrambi
- **WHEN** in una giornata si giocano 3 partite
- **THEN** il totale della barra di quella giornata è 6, perché ogni partita accredita una presenza a ciascuno dei due giocatori

#### Scenario: Confrontabile con le vittorie
- **WHEN** l'utente confronta la barra di un giorno nei due grafici della card "Partite"
- **THEN** i segmenti di uno stesso giocatore usano lo stesso colore e lo stesso ordine di impilamento in entrambi

### Requirement: Wins per day chart
Il sistema SHALL rappresentare le vittorie per giorno come grafico a barre verticali in ordine cronologico, dove l'altezza di ogni barra è il numero di partite vinte quel giorno e i segmenti impilati rappresentano i vincitori, usando gli stessi colori della legenda condivisa.

#### Scenario: Barra suddivisa per vincitore
- **WHEN** in una giornata si sono giocate 4 partite vinte da due giocatori diversi
- **THEN** la barra di quella giornata ha altezza pari a 4 ed è divisa nei segmenti dei due vincitori, ciascuno nel colore associato al giocatore

#### Scenario: Giornate senza partite non generano barre
- **WHEN** tra due giornate di gioco intercorre una settimana senza partite
- **THEN** il grafico non mostra barre a zero per i giorni intermedi, mantenendo comunque l'ordine cronologico delle giornate rappresentate

### Requirement: Legend filters the charts
Il sistema SHALL rendere ogni voce della legenda un interruttore che accende e spegne il giocatore corrispondente in tutti i grafici, mantenendolo elencato anche da spento e conservando la scelta attraverso l'auto-refresh.

#### Scenario: Spegnere un giocatore
- **WHEN** l'utente clicca la voce di legenda di un giocatore acceso
- **THEN** quel giocatore sparisce da tutti i grafici, e la sua voce resta in legenda in stato spento, così da poterlo riaccendere

#### Scenario: I totali si ricalcolano
- **WHEN** un giocatore viene spento
- **THEN** le barre delle presenze e delle vittorie non contano più le sue, e la scala dell'andamento ELO si adatta ai soli giocatori accesi

#### Scenario: Il filtro sopravvive all'auto-refresh
- **WHEN** l'auto-refresh rigenera i grafici mentre un giocatore è spento
- **THEN** resta spento, invece di riapparire a ogni aggiornamento

#### Scenario: Tutti spenti
- **WHEN** l'utente spegne ogni giocatore
- **THEN** i grafici mostrano un messaggio che invita a riaccenderne uno, invece di assi vuoti

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
- **THEN** i giocatori in eccedenza usano un colore neutro condiviso invece di riusare una tinta già assegnata, restando comunque disegnati e identificati dalla propria etichetta

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
