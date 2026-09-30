## Context

Tutto il calcolo del rating avviene nel browser: a ogni render la pagina rifà il replay dell'intero storico restituito da `doGet`, senza salvare stati intermedi. Una riga del foglio è `{data, giocatore1, giocatore2, vincitore}`: la data ha la granularità del giorno (niente ora, niente fuso), non ci sono id di partita e i giocatori sono identificati dal nome. I rinomini sono gestiti da `onEdit`, che riscrive il nome su tutto lo storico.

La specifica di riferimento è il documento "Puzzle Bobble Rating System — Glicko-2 Handover Spec" (30/09/2026), che fissa parametri, algoritmo e test di accettazione.

## Goals / Non-Goals

**Goals:**
- Glicko-2 standard (passi 3–8 di Glickman), con periodo = giornata attiva, crescita pigra della RD e tetto a 350.
- Classifica per `r − 2·RD`, badge provvisorio sopra RD 150, delta per giocatore nello storico.
- Il motore è testabile in Node con i casi di accettazione della specifica.

**Non-Goals:**
- Margine di vittoria, modifiche al form o al foglio, decadimento a tempo, cambi alla permanenza in vetta.

## Decisions

### Replay completo lato client, nessun job di fine giornata
Apps Script permetterebbe un trigger giornaliero (`ScriptApp.newTrigger(...).timeBased().everyDays(1)`), ma non serve: il replay di qualche migliaio di partite dura millisecondi e la pagina lo fa già a ogni render. Lo "stato provvisorio" della specifica è semplicemente il replay che tratta la giornata di oggi come chiusa. Niente snapshot salvati vuol dire niente stati da tenere allineati con il foglio, e le correzioni a mano sul foglio restano visibili subito.

### Periodo dalla data del foglio, nel fuso dell'ufficio
La data arriva come `gg/mm/aaaa` (letta così com'è) o come timestamp ISO della mezzanotte locale; quest'ultimo viene convertito in giorno con `Intl.DateTimeFormat` nel fuso `RATING_CONFIG.TIMEZONE` (`Europe/Rome`), non in quello del browser. Senza orario, l'ordine dentro la giornata è l'ordine di riga, che per Glicko-2 non conta: ogni partita usa i rating di inizio giornata.

### Somme in ordine canonico
Per ottenere stati identici bit per bit a ogni permutazione delle partite di un giorno, la lista partite di ciascun giocatore viene ordinata per (avversario, risultato) prima delle somme. Così anche l'arrotondamento in virgola mobile non dipende dall'ordine di riga.

### Delta per partita nello storico
Il delta di una partita, per ciascun giocatore, è il punteggio prudente con la giornata chiusa includendo quella partita, meno il suo punteggio precedente: per la prima partita del giorno, quello a fine dell'ultima giornata attiva; per le successive, quello dopo la sua partita precedente dello stesso giorno. La somma dei delta di un giocatore in una giornata è quindi la sua variazione di punteggio tra ieri e oggi. Costo O(k²) per una giornata di k partite, trascurabile.

### Elo classico come seconda vista, con un selettore dentro Statistiche
Il vecchio Elo resta disponibile in modo permanente. Un selettore "Rating | Elo classico" in cima alla sezione Statistiche cambia solo le stat card, e il podio compare solo nella vista Rating: una quarta pill nella nav principale non starebbe a 320px accanto alle altre tre, e la scelta riguarda una vista della sezione, non la sezione. Storico, grafici e permanenza in vetta restano sul Rating, che è la classifica di riferimento; a ogni caricamento si riparte dal Rating.

### Motore in `rating.js`
Un file senza build che si registra su `globalThis.Rating` (pagina) e su `module.exports` (Node). I parametri stanno tutti in `RATING_CONFIG`; σ indica sempre la volatilità, mai la RD. Il vecchio Elo è spostato in `elo.js`, con lo stesso schema (`globalThis.Elo` / `module.exports`): la pagina lo usa per la vista "Elo classico" e `tools/compare-ratings.mjs` per il report di migrazione.

## Risks / Trade-offs

- [La pagina ora dipende da altri due file] → chi pubblica `index.html` deve pubblicare anche `rating.js` ed `elo.js`; senza, la pagina fallisce subito e in modo visibile.
- [Righe non valide finora scartate in silenzio] → `validateLog` le segnala in console e il tool di confronto si ferma finché non sono corrette.
- [La classifica cambia molto per chi ha poche partite] → previsto dalla specifica; il report di confronto va rivisto prima di pubblicare.
