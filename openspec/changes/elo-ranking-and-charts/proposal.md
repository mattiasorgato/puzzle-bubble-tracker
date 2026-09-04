## Why

La classifica attuale ordina i giocatori per win rate (`wins / played`, vedi `updatePodium`). È un criterio che premia chi ha scelto gli avversari più deboli e che, soprattutto, rende il podio instabile all'inizio: un giocatore con una sola partita vinta risulta al 100% e scavalca chi ha 18-4. Un rating Elo risolve entrambi i problemi con gli stessi dati già presenti sul foglio, perché tiene conto della forza dell'avversario e cresce solo gradualmente.

Oltre alla classifica, la pagina oggi mostra solo numeri aggregati: non si vede l'andamento nel tempo (chi sta salendo, chi è fermo), né quanto a lungo il leader tiene la vetta — che è l'informazione più "da torneo" di tutte. Infine, la tabella storico spreca una colonna intera per ripetere un nome già presente nelle due colonne precedenti.

## What Changes

- Sostituire il **win rate con un rating Elo** come metrica di classifica e come numero mostrato: podio ordinato per Elo e stat card con il rating al posto della percentuale di vittorie. Il record W-L resta (è informazione diversa dal rating).
- Mostrare, **sotto il nome del giocatore in prima posizione sul podio**, da quanti giorni consecutivi occupa la vetta (es. `👑 12 giorni`).
- Aggiungere una **terza tab "📈 Grafici"** con tre grafici, resi in SVG inline senza librerie esterne:
  - *Andamento classifica*: una linea per giocatore, posizione in classifica giorno per giorno.
  - *Partite giocate*: barre orizzontali, una per giocatore, ordinate per numero di partite.
  - *Vittorie per giorno*: barre verticali, una per giornata, suddivise per colore del vincitore.
- Nella **tabella storico**, rimuovere la colonna "Vincitore" e marcare invece il vincitore con una corona accanto al suo nome nella colonna in cui già compare.

## Capabilities

### New Capabilities
- `player-ranking`: definisce il rating Elo (parametri, ordine di replay, criteri di ordinamento della classifica) e il calcolo della permanenza in vetta del leader.
- `stats-charts`: definisce la tab "Grafici" e i tre grafici SVG (andamento classifica, partite giocate, vittorie per giorno), inclusa l'assegnazione stabile dei colori per giocatore e gli stati vuoti.

### Modified Capabilities
- `tabbed-navigation`: la nav a pills passa da due a tre opzioni, con "Grafici" come terza sezione.
- `ui-theme`: il badge vincitore della tabella storico è sostituito da una corona accanto al nome del vincitore.

## Impact

- File coinvolto: [index.html](index.html) (unico file del progetto).
- Nessuna modifica al foglio Google né al formato dati: Elo, permanenza in vetta e grafici sono tutti derivati dalle partite già restituite dall'endpoint (`data`, `giocatore1`, `giocatore2`, `vincitore`).
- `getPlayerStats` resta invariata; il rating è calcolato da una nuova funzione che fa un replay dell'intero storico, richiamata dallo stesso `updateUI` degli altri render.
- Nessuna nuova dipendenza esterna: i grafici sono SVG generati a mano, coerenti con l'attuale approccio a file singolo.
- La colonna "Vincitore" sparisce dalla tabella storico: chi legge lo storico deve cercare la corona invece della quarta colonna.
