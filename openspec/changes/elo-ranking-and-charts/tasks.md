## 1. Rating Elo

- [x] 1.1 Aggiungere `computeRatings()`: replay di `allMatches` in ordine di riga, rating iniziale 1000, K 24, attesa `1 / (1 + 10^((Rb - Ra) / 400))`; restituisce una mappa `nome -> rating`
- [x] 1.2 Aggiungere `rankPlayers(ratings)`: ordina per Elo desc, poi vittorie, poi partite giocate, poi `localeCompare` sul nome (criterio totale, stabile tra i refresh)
- [x] 1.3 Aggiornare `updatePodium` per ordinare con `rankPlayers` e mostrare il rating arrotondato al posto di `${r.winPercent}% win`, mantenendo il record W-L
- [x] 1.4 Aggiornare `updateStats` per mostrare il rating Elo al posto della percentuale di vittorie, rinominando `.stat-percentage` in `.stat-rating`
- [x] 1.5 Rimuovere `winPercent` da `getPlayerStats` se non più usato da alcun render

## 2. Permanenza in vetta

- [x] 2.1 Aggiungere `matchDayKey(value)`: normalizza `match.data` (formato `gg/mm/aaaa` o timestamp ISO) a una chiave giorno ordinabile, riusando la logica di fuso già presente in `formatDate`
- [x] 2.2 Aggiungere `leaderStreakDays()`: raggruppa le partite per giornata, calcola il leader alla fine di ogni giornata, risale indietro finché il leader coincide con quello attuale, restituisce i giorni di calendario da quel giorno a oggi (minimo 1)
- [x] 2.3 Mostrare la permanenza sotto il nome del primo classificato sul podio (`👑 N giorni`), solo sulla posizione 1
- [x] 2.4 Stile `.podium-streak` coerente col tema (oro/giallo neon), senza rompere l'allineamento dei tre blocchi del podio

## 3. Tab Grafici

- [x] 3.1 Aggiungere la terza pill `#tabCharts` ("📈 Grafici") nel `role="tablist"` e la sezione `#chartsSection` con `role="tabpanel"` e stato di loading iniziale
- [x] 3.2 Registrare la nuova coppia pill/pannello nell'array `tabs` (la logica di `switchTab` è già generica e non va modificata)
- [x] 3.3 Verificare il layout delle pill a tre voci su 320px: nessun overflow, testo non troncato in modo illeggibile
- [x] 3.4 Aggiungere `playerColor(name)`: slot della palette categorica per indice alfabetico, colore neutro oltre l'ottavo giocatore (nessun riciclo di tinte)

## 4. Grafici SVG

- [x] 4.1 Aggiungere `renderRankHistory()`: linea per giocatore, X per giornata, Y sulla posizione in classifica invertita (1 in alto), con legenda nomi/colori
- [x] 4.2 Aggiungere `renderGamesPlayed()`: barre orizzontali per giocatore ordinate per partite decrescenti, valore numerico accanto a ogni barra
- [x] 4.3 Aggiungere `renderWinsPerDay()`: barre verticali per giornata giocata, altezza = partite del giorno, segmenti impilati per vincitore con i colori condivisi
- [x] 4.4 Aggiungere `updateCharts()` che richiama i tre render, e collegarla a `updateUI`
- [x] 4.5 Stato vuoto: messaggio esplicito al posto dei grafici quando `allMatches` è vuoto, senza assi disegnati né errori in console
- [x] 4.6 SVG responsive (`viewBox` + `width: 100%`), etichette leggibili a 320px, testo degli assi su `--text-muted`/`--text-primary` e non sui colori di serie

## 5. Stat card ordinate e riga compatta su mobile

- [x] 5.1 Ordinare le stat card con `rankedPlayers()` invece che alfabeticamente, aggiungendo `.stat-rank` (`#1`, `#2`, …) su ogni card
- [x] 5.2 Raggruppare valore ed etichetta in `.stat-record`, cosi' che su mobile si spostino come un blocco unico
- [x] 5.3 Su `max-width: 640px` trasformare `.stat-card` in una riga a griglia (posizione, nome, record, rating) e `.stats-grid` in colonna singola
- [x] 5.4 Troncare il nome con ellissi invece di mandarlo a capo, con il nome completo nel `title` della card
- [x] 5.5 Togliere `.stat-label` dal flusso visivo su mobile mantenendola leggibile dagli screen reader

## 6. Storico senza colonna Vincitore

- [x] 6.1 Rimuovere la colonna "Vincitore" da `<thead>` e dalle righe generate in `updateHistory`
- [x] 6.2 Anteporre `👑` al nome del vincitore nella colonna in cui già compare (giocatore 1 o giocatore 2)
- [x] 6.3 Sostituire la classe `.winner-badge` con `.winner-name` (evidenziazione del nome, non più badge) e rimuovere il CSS del badge ormai inutilizzato

## 7. Verifica manuale

- [x] 7.1 Verificare che un giocatore 1-0 non compaia più davanti a un giocatore con storico consolidato sul podio
- [x] 7.2 Verificare che due refresh consecutivi sugli stessi dati non cambino l'ordine di podio e stat card
- [x] 7.3 Verificare la permanenza in vetta su casi costruiti: leader con giorni di pausa (10 giorni), storico di una sola giornata (1 giorno), cambio di leader (riparte da capo)
- [x] 7.4 Verificare i tre grafici a 320px e 900px: nessun overflow orizzontale (`scrollWidth == innerWidth`), etichette dell'asse date senza sovrapposizioni
- [x] 7.5 Verificare lo storico: tre colonne, corona sul vincitore corretto in entrambe le posizioni (giocatore 1 e giocatore 2)
- [x] 7.7 Verificare il cambio tab a tre pill in tempo reale: una sola sezione visibile a ogni passaggio, `aria-selected` aggiornato, avanti-indietro rapido e ramo `prefers-reduced-motion`
- [x] 7.9 Verificare le stat card a 320px, 390px e 640px: righe tutte della stessa altezza (nessun a capo), nome lungo troncato con ellissi, nessun overflow orizzontale; a >640px il layout a griglia resta invariato

### Da verificare sul foglio vero

- [ ] 7.6 Ciclo completo di salvataggio: inserire una partita dal form e vedere podio, stat card, grafici e storico aggiornarsi senza reload — richiede l'endpoint Apps Script reale, non coperto dalle verifiche locali (che usano un `fetch` finto)
- [ ] 7.8 Confrontare la permanenza in vetta e i rating con i dati reali del foglio, per confermare che le date arrivino nel formato atteso
