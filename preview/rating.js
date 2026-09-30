// Motore di rating Glicko-2 (documento di riferimento: Glickman, "Example of
// the Glicko-2 system"). File senza build: nella pagina si registra come
// globalThis.Rating, in Node come modulo, cosi' i test girano sullo stesso
// codice che usa la classifica.
//
// Nomenclatura: RD e' la deviazione del rating (incertezza), sigma e' la
// volatilita' di Glicko-2. Sono grandezze diverse: sigma non indica mai la RD.
(function (root) {
  'use strict';

  const RATING_CONFIG = Object.freeze({
    INITIAL_RATING: 1000,       // centro della scala mostrata (Glickman usa 1500)
    INITIAL_RD: 350,
    INITIAL_VOLATILITY: 0.06,
    TAU: 0.5,                   // vincola quanto in fretta cambia la volatilita'
    RD_CAP: 350,
    SCALE: 173.7178,            // conversione scala mostrata <-> scala interna
    EPSILON: 0.000001,          // tolleranza dell'iterazione sulla volatilita'
    SCORE_RD_MULTIPLIER: 2,     // punteggio in classifica: r - 2 * RD
    PROVISIONAL_RD: 150,        // oltre questa RD il giocatore e' provvisorio
    TIMEZONE: 'Europe/Rome'     // la giornata e' quella dell'ufficio, non UTC
  });

  // Con limiti di partenza corretti l'iterazione converge in poche decine di
  // passi: se non succede c'e' un errore nei dati o nelle formule, e un valore
  // indovinato falserebbe in silenzio tutto il replay successivo.
  const MAX_ITERATIONS = 100;

  // -------------------------------------------------------------------------
  // Giornate
  // -------------------------------------------------------------------------

  const dayFormatters = new Map();

  // Chiave giorno aaaa-mm-gg, ordinabile come stringa. Una gg/mm/aaaa va letta
  // com'e': passarla a new Date() la farebbe interpretare alla americana
  // (03/09 -> 9 marzo). Un timestamp va riletto nel fuso dell'ufficio, non in
  // quello del browser: il foglio manda la mezzanotte locale come 22:00Z del
  // giorno prima, e chi apre la pagina da un altro fuso vedrebbe le partite
  // slittare di giorno.
  function dayKey(value, timeZone = RATING_CONFIG.TIMEZONE) {
    if (!value) return null;

    const itDate = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value).trim());
    if (itDate) return `${itDate[3]}-${itDate[2]}-${itDate[1]}`;

    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d)) return null;

    if (!dayFormatters.has(timeZone)) {
      dayFormatters.set(timeZone, new Intl.DateTimeFormat('en-CA', {
        timeZone, year: 'numeric', month: '2-digit', day: '2-digit'
      }));
    }

    const parts = {};
    dayFormatters.get(timeZone).formatToParts(d).forEach(p => { parts[p.type] = p.value; });
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  function todayKey(timeZone = RATING_CONFIG.TIMEZONE) {
    return dayKey(new Date(), timeZone);
  }

  // Ordine canonico delle partite: per giornata crescente e, dentro la stessa
  // giornata, per ordine di riga sul foglio (la data non ha orario). Per
  // Glicko-2 l'ordine dentro la giornata non cambia il risultato, ma serve lo
  // stesso un ordine unico per raggruppare e per i delta dello storico.
  // Una data illeggibile eredita la giornata della riga precedente invece di
  // essere scartata (validateLog la segnala); se capita in testa, eredita la
  // prima giornata leggibile.
  function chronologicalMatches(matches, timeZone = RATING_CONFIG.TIMEZONE) {
    const keys = matches.map(m => dayKey(m.data, timeZone));
    let day = keys.find(Boolean) || todayKey(timeZone);

    return matches
      .map((match, row) => {
        if (keys[row]) day = keys[row];
        return { match, row, day };
      })
      .sort((a, b) => a.day.localeCompare(b.day) || a.row - b.row);
  }

  // Motivo per cui una riga non puo' entrare nel replay, o null se e' valida.
  function matchProblem(match, roster) {
    const a = match.giocatore1;
    const b = match.giocatore2;

    if (a === b) return 'stesso giocatore da entrambe le parti';
    if (roster && (!roster.has(a) || !roster.has(b))) return 'giocatore fuori rosa';
    if (match.vincitore !== a && match.vincitore !== b) return 'vincitore diverso dai due giocatori';
    return null;
  }

  // Anomalie dello storico, da correggere sul foglio: il replay salta le righe
  // non valide, ma non deve farlo in silenzio.
  function validateLog(matches, roster, timeZone = RATING_CONFIG.TIMEZONE) {
    const rosterSet = roster ? new Set(roster) : null;
    const anomalies = [];

    matches.forEach((match, row) => {
      if (!dayKey(match.data, timeZone)) anomalies.push({ row, match, problem: 'data mancante o illeggibile' });

      const problem = matchProblem(match, rosterSet);
      if (problem) anomalies.push({ row, match, problem });
    });

    return anomalies;
  }

  // -------------------------------------------------------------------------
  // Glicko-2
  // -------------------------------------------------------------------------

  function g(phi) {
    return 1 / Math.sqrt(1 + 3 * phi * phi / (Math.PI * Math.PI));
  }

  function expected(mu, muj, phij) {
    return 1 / (1 + Math.exp(-g(phij) * (mu - muj)));
  }

  function capPhi(phi, config) {
    return Math.min(phi, config.RD_CAP / config.SCALE);
  }

  // Crescita della RD dopo n periodi senza partite. Senza partite sigma non
  // cambia, quindi n passi di phi' = sqrt(phi^2 + sigma^2) hanno forma chiusa.
  function growPhi(phi, sigma, n, config = RATING_CONFIG) {
    if (n <= 0) return phi;
    return capPhi(Math.sqrt(phi * phi + n * sigma * sigma), config);
  }

  // Passo 5 di Glickman: nuova volatilita' con l'algoritmo di Illinois.
  function newVolatility(phi, sigma, v, delta, config) {
    const tau = config.TAU;
    const a = Math.log(sigma * sigma);
    const f = x => {
      const ex = Math.exp(x);
      const d = phi * phi + v + ex;
      return ex * (delta * delta - phi * phi - v - ex) / (2 * d * d) - (x - a) / (tau * tau);
    };
    const fail = step => {
      const inputs = { phi, sigma, v, delta, tau, epsilon: config.EPSILON };
      console.error('Glicko-2: volatilita\' non convergente', step, inputs);
      throw new Error(`Glicko-2: volatilita' non convergente (${step}): ${JSON.stringify(inputs)}`);
    };

    let A = a;
    let B;
    if (delta * delta > phi * phi + v) {
      B = Math.log(delta * delta - phi * phi - v);
    } else {
      let k = 1;
      while (f(a - k * tau) < 0) {
        if (++k > MAX_ITERATIONS) fail('limite inferiore');
      }
      B = a - k * tau;
    }

    let fA = f(A);
    let fB = f(B);
    let iterations = 0;

    while (Math.abs(B - A) > config.EPSILON) {
      if (++iterations > MAX_ITERATIONS) fail('iterazione');

      const C = A + (A - B) * fA / (fB - fA);
      const fC = f(C);

      if (fC * fB <= 0) {
        A = B;
        fA = fB;
      } else {
        fA = fA / 2;
      }
      B = C;
      fB = fC;
    }

    return Math.exp(A / 2);
  }

  // Passi 3-8 di Glickman sulla scala interna. `games` sono le partite del
  // periodo, ciascuna con mu/phi dell'avversario a inizio periodo e score 1/0.
  function glickoUpdate(player, games, config = RATING_CONFIG) {
    const { mu, phi, sigma } = player;
    let vInv = 0;
    let sum = 0;

    games.forEach(game => {
      const gj = g(game.phi);
      const e = expected(mu, game.mu, game.phi);
      vInv += gj * gj * e * (1 - e);
      sum += gj * (game.score - e);
    });

    const v = 1 / vInv;
    const sigmaNew = newVolatility(phi, sigma, v, v * sum, config);
    const phiStar = capPhi(Math.sqrt(phi * phi + sigmaNew * sigmaNew), config);
    const phiNew = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);

    return { mu: mu + phiNew * phiNew * sum, phi: phiNew, sigma: sigmaNew };
  }

  function toInternal(rating, rd, config = RATING_CONFIG) {
    return { mu: (rating - config.INITIAL_RATING) / config.SCALE, phi: rd / config.SCALE };
  }

  function toDisplay(mu, phi, config = RATING_CONFIG) {
    return { rating: config.SCALE * mu + config.INITIAL_RATING, rd: config.SCALE * phi };
  }

  // -------------------------------------------------------------------------
  // Periodi e replay
  // -------------------------------------------------------------------------

  // Lo stato e' una Map nome -> { mu, phi, sigma, played, wins, lastPeriod }:
  // phi e' quello alla chiusura di lastPeriod, l'ultimo periodo giocato. La
  // crescita per i periodi saltati si applica solo quando serve (pigra).
  // Chi non ha ancora giocato non e' nello stato e non cresce.

  function startOf(state, name, period, config) {
    const p = state.get(name);
    if (!p) return { ...toInternal(config.INITIAL_RATING, config.INITIAL_RD, config), sigma: config.INITIAL_VOLATILITY };
    return { mu: p.mu, phi: growPhi(p.phi, p.sigma, period - 1 - p.lastPeriod, config), sigma: p.sigma };
  }

  // Chiude il periodo `period` con le sue partite ({winner, loser}) e
  // restituisce un NUOVO stato: quello passato resta intatto, perche' i delta
  // dello storico richiudono piu' volte lo stesso periodo dalla stessa base.
  // Ogni partita usa i rating di inizio periodo, quindi l'ordine delle partite
  // non conta; le liste di ciascun giocatore sono comunque ordinate per
  // (avversario, risultato) prima delle somme, cosi' anche l'arrotondamento in
  // virgola mobile e' lo stesso per qualunque ordine di riga.
  function closePeriod(state, period, games, config = RATING_CONFIG) {
    const start = new Map();
    const lists = new Map();

    const entry = (name, opponent, score) => {
      if (!start.has(name)) {
        start.set(name, startOf(state, name, period, config));
        lists.set(name, []);
      }
      lists.get(name).push({ opponent, score });
    };

    games.forEach(({ winner, loser }) => {
      entry(winner, loser, 1);
      entry(loser, winner, 0);
    });

    const next = new Map(state);

    lists.forEach((list, name) => {
      list.sort((x, y) => (x.opponent < y.opponent ? -1 : x.opponent > y.opponent ? 1 : x.score - y.score));

      const opponents = list.map(({ opponent, score }) => {
        const o = start.get(opponent);
        return { mu: o.mu, phi: o.phi, score };
      });

      const updated = glickoUpdate(start.get(name), opponents, config);
      const prev = state.get(name);
      const wins = list.reduce((n, x) => n + x.score, 0);

      next.set(name, {
        ...updated,
        played: (prev ? prev.played : 0) + list.length,
        wins: (prev ? prev.wins : 0) + wins,
        lastPeriod: period
      });
    });

    return next;
  }

  // Valori da mostrare per un giocatore, con lo stato letto alla chiusura del
  // periodo `period`. Chi non e' nello stato ha i valori di partenza.
  function viewOf(state, period, name, config = RATING_CONFIG) {
    const p = state.get(name);
    const internal = p
      ? { mu: p.mu, phi: growPhi(p.phi, p.sigma, period - p.lastPeriod, config), sigma: p.sigma }
      : startOf(state, name, period, config);
    const { rating, rd } = toDisplay(internal.mu, internal.phi, config);
    const played = p ? p.played : 0;
    const wins = p ? p.wins : 0;

    return {
      player: name,
      rating,
      rd,
      volatility: internal.sigma,
      score: rating - config.SCORE_RD_MULTIPLIER * rd,
      provisional: rd > config.PROVISIONAL_RD,
      played,
      wins,
      losses: played - wins
    };
  }

  // Ordine totale: punteggio, poi partite giocate, poi nome. Senza un ordine
  // totale due giocatori appaiati si scambierebbero di posto a ogni refresh.
  function compareStandings(a, b) {
    return b.score - a.score || b.played - a.played || a.player.localeCompare(b.player);
  }

  function standings(state, period, config = RATING_CONFIG) {
    return Array.from(state.keys())
      .map(name => viewOf(state, period, name, config))
      .sort(compareStandings);
  }

  // Raggruppa le partite valide per giornata: ogni giornata con almeno una
  // partita e' un periodo, i giorni senza partite non esistono.
  function periodsOf(ordered, roster) {
    const rosterSet = roster ? new Set(roster) : null;
    const periods = [];

    ordered.forEach(({ match, day }) => {
      if (matchProblem(match, rosterSet)) return;

      const loser = match.vincitore === match.giocatore1 ? match.giocatore2 : match.giocatore1;
      if (periods.length === 0 || periods[periods.length - 1].day !== day) periods.push({ day, games: [] });
      periods[periods.length - 1].games.push({ match, winner: match.vincitore, loser });
    });

    return periods;
  }

  // Replay completo dello storico ordinato (vedi chronologicalMatches).
  // `period` e' l'indice dell'ultima giornata attiva: lo stato va letto li',
  // ed e' lo stato "provvisorio" della specifica, come se la giornata di oggi
  // si chiudesse adesso. `byDay` ha la classifica a fine di ogni giornata.
  function replay(ordered, roster, config = RATING_CONFIG) {
    let state = new Map();
    const byDay = [];

    periodsOf(ordered, roster).forEach(({ day, games }, period) => {
      state = closePeriod(state, period, games, config);
      byDay.push({ day, standings: standings(state, period, config) });
    });

    return { state, period: byDay.length - 1, byDay };
  }

  // Delta del punteggio per partita e per giocatore, per lo storico:
  // Map partita -> Map nome -> delta. Per ogni giocatore, il delta e' il suo
  // punteggio con la giornata chiusa fino a quella partita compresa, meno il
  // punteggio precedente (a fine dell'ultima giornata attiva per la prima
  // partita del giorno, dopo la sua partita precedente per le altre). La somma
  // dei delta di una giornata e' quindi la variazione tra ieri e oggi.
  function matchDeltas(ordered, roster, config = RATING_CONFIG) {
    const deltas = new Map();
    let state = new Map();

    periodsOf(ordered, roster).forEach(({ games }, period) => {
      const last = new Map();
      const before = name => (last.has(name) ? last.get(name) : viewOf(state, period - 1, name, config).score);
      let closed = state;

      games.forEach((game, i) => {
        closed = closePeriod(state, period, games.slice(0, i + 1), config);

        const perPlayer = new Map();
        [game.winner, game.loser].forEach(name => {
          const score = viewOf(closed, period, name, config).score;
          perPlayer.set(name, score - before(name));
          last.set(name, score);
        });
        deltas.set(game.match, perPlayer);
      });

      state = closed;
    });

    return deltas;
  }

  const Rating = {
    RATING_CONFIG,
    dayKey,
    todayKey,
    chronologicalMatches,
    validateLog,
    glickoUpdate,
    growPhi,
    toInternal,
    toDisplay,
    closePeriod,
    viewOf,
    compareStandings,
    standings,
    replay,
    matchDeltas
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Rating;
  else root.Rating = Rating;
})(typeof globalThis !== 'undefined' ? globalThis : this);
