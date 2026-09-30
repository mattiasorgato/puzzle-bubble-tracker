// Motore Elo classico: la seconda vista della classifica ("Elo classico"),
// accanto al Rating Glicko-2 di rating.js. Serve anche a
// tools/compare-ratings.mjs per il confronto tra i due sistemi.
// Come rating.js: nella pagina si registra come globalThis.Elo, in Node come
// modulo.
//
// Tutti partono da 1000 e si scambiano K punti pesati sull'attesa, a somma
// zero, senza nessuna misura di incertezza.
(function (root) {
  'use strict';

  const ELO_START = 1000;
  const ELO_K = 24;

  // `ordered` e' l'uscita di Rating.chronologicalMatches: qui, a differenza
  // di Glicko-2, l'ordine delle partite conta. Restituisce la classifica di
  // chi ha almeno una partita valida, ordinata per rating, vittorie, partite,
  // nome.
  function eloRanking(ordered, players) {
    const ratings = new Map(players.map(p => [p, ELO_START]));
    const wins = new Map(players.map(p => [p, 0]));
    const played = new Map(players.map(p => [p, 0]));

    ordered.forEach(({ match }) => {
      const a = match.giocatore1;
      const b = match.giocatore2;

      if (a === b || !ratings.has(a) || !ratings.has(b)) return;
      if (match.vincitore !== a && match.vincitore !== b) return;

      const scoreA = match.vincitore === a ? 1 : 0;
      const expectedA = 1 / (1 + Math.pow(10, (ratings.get(b) - ratings.get(a)) / 400));
      const delta = ELO_K * (scoreA - expectedA);

      // Somma zero: quello che A guadagna, B lo perde
      ratings.set(a, ratings.get(a) + delta);
      ratings.set(b, ratings.get(b) - delta);

      played.set(a, played.get(a) + 1);
      played.set(b, played.get(b) + 1);
      wins.set(match.vincitore, wins.get(match.vincitore) + 1);
    });

    return players
      .filter(p => played.get(p) > 0)
      .sort((a, b) =>
        ratings.get(b) - ratings.get(a)
        || wins.get(b) - wins.get(a)
        || played.get(b) - played.get(a)
        || a.localeCompare(b)
      )
      .map(player => ({
        player,
        rating: ratings.get(player),
        wins: wins.get(player),
        losses: played.get(player) - wins.get(player),
        played: played.get(player)
      }));
  }

  const Elo = { ELO_START, ELO_K, eloRanking };

  if (typeof module !== 'undefined' && module.exports) module.exports = Elo;
  else root.Elo = Elo;
})(typeof globalThis !== 'undefined' ? globalThis : this);
