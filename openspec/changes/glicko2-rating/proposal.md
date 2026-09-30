## Why

L'Elo attuale (partenza 1000, K 24) da' a ogni giocatore un solo numero, senza nessuna idea di quanto sia affidabile. Chi vince due partite fortunate parte da 1000, sale e resta in alto semplicemente smettendo di giocare: sul foglio di oggi un 2-0 e' terzo davanti a un 51-42, e un 0-2 sta sopra giocatori con piu' di 40 partite. La classifica premia chi sta fermo invece di chi gioca.

## What Changes

- **BREAKING (numeri in classifica)**: il motore Elo viene sostituito da **Glicko-2** (riferimento: documento di Glickman). Ogni giocatore ha rating r, deviazione RD (incertezza) e volatilita' σ.
- La classifica si ordina per **punteggio prudente r − 2·RD**, mostrato come "Rating" al posto di "Elo" su podio, stat card, grafico e tooltip. A parita': piu' partite, poi ordine alfabetico.
- Il **periodo di rating e' la giornata attiva**: un giorno di calendario (fuso `Europe/Rome`) in cui e' stata giocata almeno una partita. Dentro la giornata tutte le partite usano i rating di inizio giornata, quindi l'ordine delle partite del giorno non cambia il risultato.
- **Inattivita'**: chi salta una giornata attiva vede crescere la propria RD (tetto 350), quindi il punteggio prudente scende piano.
- **Provvisorio**: badge sui giocatori con RD > 150; restano in classifica. Stat card con `r ± RD`, e una riga di spiegazione del rating.
- **Storico**: il badge `(+N)` diventa il delta *del singolo giocatore* (Glicko-2 non e' a somma zero, i due numeri sono diversi).
- Il motore esce da `index.html` in un file `rating.js` testato con `node --test`. Il vecchio Elo passa in `elo.js` e resta come **seconda vista permanente**: un selettore "Rating | Elo classico" in Statistiche cambia le stat card, e nella vista Elo il podio non compare (storico, grafici e podio restano sul Rating). Lo stesso file serve al report di confronto.
- Le date sono lette nel fuso dell'ufficio e non piu' in quello del browser.

## Capabilities

### New Capabilities
Nessuna.

### Modified Capabilities
- `player-ranking`: il rating Elo e l'ordinamento per rating diventano Glicko-2 con punteggio prudente, periodo giornaliero, crescita della RD e badge provvisorio. La permanenza in vetta resta com'e'.
- `stats-charts`: "Andamento ELO" diventa "Andamento Rating" e traccia il punteggio prudente.

## Impact

- `index.html`: rimozione del motore Elo inline, wiring verso `rating.js`, etichette e badge.
- Nuovi file: `rating.js`, `elo.js`, `tests/rating.test.mjs`, `tests/elo.test.mjs`, `tools/compare-ratings.mjs`.
- `apps-script/Code.gs`: nessuna modifica (rifiuta gia' le partite con due giocatori uguali).
- Nessuna modifica al foglio ne' al formato dati, nessuna dipendenza npm, nessun job schedulato.
- Chi ospita la pagina deve servire anche `rating.js` ed `elo.js` accanto a `index.html`.
