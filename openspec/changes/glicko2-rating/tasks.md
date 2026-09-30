## 1. Motore `rating.js`

- [x] 1.1 `RATING_CONFIG` unico e congelato con tutti i parametri della specifica, fuso `Europe/Rome` compreso
- [x] 1.2 `dayKey`/`todayKey` nel fuso configurato; `chronologicalMatches` spostata da `index.html`
- [x] 1.3 `validateLog`: data mancante o illeggibile, giocatore fuori rosa, stesso giocatore due volte, vincitore non valido
- [x] 1.4 `glickoUpdate` (passi 3–8, Illinois, tetto su φ*, errore esplicito se non converge) e `growPhi` in forma chiusa
- [x] 1.5 `closePeriod`, `replay` con snapshot per giornata, `viewOf`, `compareStandings`, `matchDeltas`

## 2. Elo classico come seconda vista

- [x] 2.1 Spostare il motore Elo in `elo.js` (`globalThis.Elo` / `module.exports`)
- [x] 2.2 Selettore "Rating | Elo classico" in Statistiche: podio solo sul Rating, la vista Elo mostra solo le stat card
- [x] 2.3 `tests/elo.test.mjs`: somma zero, righe non valide, ordinamento

## 3. Wiring in `index.html`

- [x] 3.1 Caricare `rating.js`; togliere il motore Elo inline e sostituire `computeRatings`/`rankedPlayers`/`dailyRankings`/`matchEloDeltas` con wrapper su `Rating`
- [x] 3.2 Podio e stat card: "N Rating", badge "Provvisorio", `r ± RD`, riga di spiegazione
- [x] 3.3 Grafico "Andamento Rating" sul punteggio prudente
- [x] 3.4 Storico: delta per giocatore, senza più il "numero uguale col segno opposto"
- [x] 3.5 Data della nuova partita e date dello storico nel fuso configurato

## 4. Test e migrazione

- [x] 4.1 `tests/rating.test.mjs` con tutti i casi di accettazione della specifica (`node --test`)
- [x] 4.2 `tools/compare-ratings.mjs`: validazione del log e report Elo vs nuovo rating
- [ ] 4.3 Rivedere il report sui dati veri prima di pubblicare

## 5. Verifica manuale

- [x] 5.1 Podio, stat card, grafico e storico con i dati veri (export del foglio, `fetch` finto, Chrome headless a 320/390/640/1200px); nessuna etichetta "Elo" visibile
- [x] 5.2 Permanenza in vetta ancora mostrata sul primo posto

### Da verificare sul foglio vero

- [ ] 5.3 Pubblicare `rating.js` ed `elo.js` accanto a `index.html` e fare un salvataggio reale dal form
