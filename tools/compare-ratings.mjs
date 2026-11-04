// Confronto predittivo tra i sistemi di classifica della pagina: Glicko-2
// (rating.js) ed Elo classico (elo.js), e le quattro classifiche in prova.
//
//   node tools/compare-ratings.mjs tools/data/snapshot.json
//   node tools/compare-ratings.mjs --synthetic
//
// Lo snapshot e' la risposta di doGet della Web App ({ success, matches,
// players }), scaricata con curl dall'APPS_SCRIPT_URL di index.html.
//
// Metodo "walk-forward": ogni giornata viene prevista con i rating di fine
// giornata precedente, poi chiusa. Nessun sistema vede il risultato che deve
// prevedere, ed entrambi usano i rating di inizio giornata, quindi l'ordine
// delle partite dentro la giornata non avvantaggia l'Elo.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const Rating = require('../rating.js');
const Elo = require('../elo.js');

const TAUS = [0.3, 0.5, 0.8, 1.2];
const BOOTSTRAP_SAMPLES = 1000;

// Generatore deterministico: stessi numeri a ogni esecuzione
function rng(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Dati
// ---------------------------------------------------------------------------

// Rosa come nella pagina: Leaderboard piu' chi compare nel match log
function loadSnapshot(path) {
  const data = JSON.parse(readFileSync(path, 'utf8'));
  if (!data.success) throw new Error(`Snapshot non valido: ${data.error}`);

  const roster = new Set(data.players || []);
  data.matches.forEach(m => { roster.add(m.giocatore1); roster.add(m.giocatore2); });
  return { matches: data.matches, roster: [...roster], truth: null };
}

// ~10 giocatori con forza vera fissa (scala Elo): 6 giocano ogni giorno, 4 in
// media due giorni a settimana. Serve a verificare lo script: con dati veri
// non si conosce la forza vera, qui si'.
function synthetic(days = 100) {
  const random = rng(42);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
  const regulars = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'];
  const partTimers = ['P1', 'P2', 'P3', 'P4'];
  const truth = new Map([...regulars, ...partTimers].map(p => [p, 1000 + 150 * gauss()]));
  const matches = [];

  for (let d = 0; d < days; d++) {
    const date = new Date(Date.UTC(2026, 0, 1 + d));
    const data = `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`;
    const present = [...regulars, ...partTimers.filter(() => random() < 2 / 7)];

    for (let i = 0; i < present.length * 4; i++) {
      const a = present[Math.floor(random() * present.length)];
      const b = present[Math.floor(random() * present.length)];
      if (a === b) continue;
      const pA = 1 / (1 + Math.pow(10, (truth.get(b) - truth.get(a)) / 400));
      matches.push({ data, giocatore1: a, giocatore2: b, vincitore: random() < pA ? a : b });
    }
  }

  return { matches, roster: [...truth.keys()], truth };
}

// Stessi controlli di rating.js/elo.js: la riga entra solo se e' giocabile
function isValid(match, rosterSet) {
  const a = match.giocatore1;
  const b = match.giocatore2;
  return a !== b && rosterSet.has(a) && rosterSet.has(b) && (match.vincitore === a || match.vincitore === b);
}

function groupByDay(ordered, roster) {
  const rosterSet = new Set(roster);
  const days = [];

  ordered.forEach((entry, index) => {
    if (!isValid(entry.match, rosterSet)) return;
    if (days.length === 0 || days[days.length - 1].day !== entry.day) days.push({ day: entry.day, start: index, games: [] });
    days[days.length - 1].games.push(entry.match);
  });

  return days;
}

// ---------------------------------------------------------------------------
// Walk-forward
// ---------------------------------------------------------------------------

function g(phi) {
  return 1 / Math.sqrt(1 + 3 * phi * phi / (Math.PI * Math.PI));
}

// Probabilita' che vinca A, formula predittiva di Glicko (RD di entrambi)
function glickoProbability(va, vb, config) {
  const a = Rating.toInternal(va.rating, va.rd, config);
  const b = Rating.toInternal(vb.rating, vb.rd, config);
  return 1 / (1 + Math.exp(-g(Math.hypot(a.phi, b.phi)) * (a.mu - b.mu)));
}

// Chiave di posizione in classifica: prima il gruppo (classificati sopra i
// non classificati), poi il valore. Confronto lessicografico.
function compareKeys(x, y) {
  return x[0] - y[0] || x[1] - y[1];
}

function walkForward(ordered, roster, days, config = Rating.RATING_CONFIG, withElo = true, truth = null) {
  let state = new Map();
  const records = [];

  days.forEach(({ games, start }, period) => {
    const before = ordered.slice(0, start);
    const elo = withElo ? new Map(Elo.eloRanking(before, roster).map(r => [r.player, r.rating])) : null;
    const eligibility = withElo ? Elo.eloEligibility(before, roster) : null;

    games.forEach(match => {
      const a = match.giocatore1;
      const b = match.giocatore2;
      const va = Rating.viewOf(state, period - 1, a, config);
      const vb = Rating.viewOf(state, period - 1, b, config);
      const record = {
        day: period,
        y: match.vincitore === a ? 1 : 0,
        pGlicko: glickoProbability(va, vb, config),
        bothSettled: !va.provisional && !vb.provisional
      };

      if (withElo) {
        const ea = elo.has(a) ? elo.get(a) : Elo.ELO_START;
        const eb = elo.has(b) ? elo.get(b) : Elo.ELO_START;
        const okA = eligibility.get(a).eligible ? 1 : 0;
        const okB = eligibility.get(b).eligible ? 1 : 0;

        record.pElo = 1 / (1 + Math.pow(10, (eb - ea) / 400));
        record.orders = {
          'Rating (r − 2·RD)': compareKeys([0, va.score], [0, vb.score]),
          'Rating grezzo': compareKeys([va.provisional ? 0 : 1, va.rating], [vb.provisional ? 0 : 1, vb.rating]),
          'Elo classico': compareKeys([0, ea], [0, eb]),
          'Elo attivi': compareKeys([okA, ea], [okB, eb])
        };
      }
      if (truth) record.pTrue = 1 / (1 + Math.pow(10, (truth.get(b) - truth.get(a)) / 400));

      records.push(record);
    });

    state = Rating.closePeriod(state, period, games.map(m => ({
      winner: m.vincitore,
      loser: m.vincitore === m.giocatore1 ? m.giocatore2 : m.giocatore1
    })), config);
  });

  return { records, state };
}

// ---------------------------------------------------------------------------
// Metriche
// ---------------------------------------------------------------------------

const mean = xs => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN);

function logLoss(p, y) {
  const q = Math.min(Math.max(p, 1e-9), 1 - 1e-9);
  return -(y * Math.log(q) + (1 - y) * Math.log(1 - q));
}

// Il favorito (o il piu' in alto in classifica) ha vinto? Pari = 0.5
function favouriteWon(sign, y) {
  return sign > 0 ? y : sign < 0 ? 1 - y : 0.5;
}

const METRICS = {
  logLoss: (rs, key) => mean(rs.map(r => logLoss(r[key], r.y))),
  order: (rs, name) => mean(rs.map(r => favouriteWon(r.orders[name], r.y)))
};

function modelTable(records, models) {
  const table = {};
  Object.entries(models).forEach(([name, key]) => {
    table[name] = {
      N: records.length,
      'log-loss': +METRICS.logLoss(records, key).toFixed(4),
      Brier: +mean(records.map(r => (r[key] - r.y) ** 2)).toFixed(4),
      'favorito vince': +mean(records.map(r => favouriteWon(r[key] - 0.5, r.y))).toFixed(3)
    };
  });
  return table;
}

function orderTable(records) {
  const table = {};
  Object.keys(records[0].orders).forEach(name => {
    table[name] = { N: records.length, 'piu\' in alto vince': +METRICS.order(records, name).toFixed(3) };
  });
  return table;
}

// Dal lato del favorito: probabilita' prevista per il favorito contro quanto
// spesso ha vinto. Non per giocatore 1: sul foglio il vincitore tende a essere
// scritto per primo (giocatore 1 vince ~64%), e una tabella per giocatore 1
// sembrerebbe sottostimarlo in ogni fascia anche con previsioni perfette.
// A pari probabilita' (50%) il favorito non c'e' e conta mezza vittoria.
function calibrationTable(records, key) {
  const folded = records.map(r => ({
    p: Math.max(r[key], 1 - r[key]),
    won: favouriteWon(r[key] - 0.5, r.y)
  }));
  const table = {};
  for (let i = 5; i < 10; i++) {
    const bin = folded.filter(r => Math.min(Math.floor(r.p * 10), 9) === i);
    if (bin.length === 0) continue;
    table[`favorito ${i * 10}-${i * 10 + 10}%`] = {
      N: bin.length,
      prevista: +mean(bin.map(r => r.p)).toFixed(3),
      osservata: +mean(bin.map(r => r.won)).toFixed(3),
      nota: bin.length < 20 ? 'pochi dati' : ''
    };
  }
  return table;
}

// Intervallo al 95% di una differenza, ricampionando le giornate (non le
// partite: quelle della stessa giornata non sono indipendenti)
function bootstrap(records, diff) {
  const byDay = new Map();
  records.forEach(r => {
    if (!byDay.has(r.day)) byDay.set(r.day, []);
    byDay.get(r.day).push(r);
  });
  const dayLists = [...byDay.values()];
  const random = rng(7);
  const samples = [];

  for (let s = 0; s < BOOTSTRAP_SAMPLES; s++) {
    const sample = [];
    for (let i = 0; i < dayLists.length; i++) sample.push(...dayLists[Math.floor(random() * dayLists.length)]);
    samples.push(diff(sample));
  }
  samples.sort((x, y) => x - y);

  const low = samples[Math.floor(0.025 * BOOTSTRAP_SAMPLES)];
  const high = samples[Math.floor(0.975 * BOOTSTRAP_SAMPLES) - 1];
  return {
    differenza: +diff(records).toFixed(4),
    'IC 95% da': +low.toFixed(4),
    'IC 95% a': +high.toFixed(4),
    esito: low > 0 ? 'meglio' : high < 0 ? 'peggio' : 'non distinguibile'
  };
}

// ---------------------------------------------------------------------------
// Taratura (--tune)
// ---------------------------------------------------------------------------

const GRID = {
  INITIAL_RD: [150, 200, 250, 300, 350],
  INITIAL_VOLATILITY: [0.02, 0.04, 0.06, 0.09],
  TAU: [0.3, 0.5, 0.8, 1.2]
};
const PERIODS = ['day', 1, 3, 5];
const ELO_KS = [8, 12, 16, 24, 32, 40, 48];
const TRAIN_SHARE = 0.6;

// Blocchi di partite di una giornata: la giornata intera, o pezzi consecutivi
// di N partite nell'ordine di riga del foglio
function chunksOf(games, size) {
  if (size === 'day') return [games];
  const chunks = [];
  for (let i = 0; i < games.length; i += size) chunks.push(games.slice(i, i + size));
  return chunks;
}

const periodLabel = size => (size === 'day' ? 'giornata' : `${size} partit${size === 1 ? 'a' : 'e'}`);

// Glicko-2 con periodi di N partite. Ogni blocco si chiude con closePeriod,
// ma con l'indice della giornata: la crescita della RD per inattivita' resta
// contata in giornate (chi ha gia' giocato oggi non cresce), mentre il passo 6
// di Glickman (phi* = sqrt(phi^2 + sigma^2)) si applica a ogni blocco. Ogni
// partita e' prevista con i rating di fine blocco precedente. Con 'day' e'
// identico a walkForward.
function glickoRun(days, config, size, withOrders = false) {
  let state = new Map();
  const records = [];

  days.forEach(({ games }, day) => {
    chunksOf(games, size).forEach(chunk => {
      chunk.forEach(match => {
        const va = Rating.viewOf(state, day - 1, match.giocatore1, config);
        const vb = Rating.viewOf(state, day - 1, match.giocatore2, config);
        const record = { day, y: match.vincitore === match.giocatore1 ? 1 : 0, p: glickoProbability(va, vb, config) };

        if (withOrders) {
          record.orders = {
            'Rating (r − 2·RD)': compareKeys([0, va.score], [0, vb.score]),
            'Rating grezzo': compareKeys([va.provisional ? 0 : 1, va.rating], [vb.provisional ? 0 : 1, vb.rating])
          };
        }
        records.push(record);
      });

      state = Rating.closePeriod(state, day, chunk.map(m => ({
        winner: m.vincitore,
        loser: m.vincitore === m.giocatore1 ? m.giocatore2 : m.giocatore1
      })), config);
    });
  });

  return records;
}

// Elo con lo stesso aggiornamento di Elo.eloRanking ma K a scelta. Le
// previsioni usano i rating di inizio blocco; gli aggiornamenti dentro il
// blocco restano in sequenza, come nella pagina. Con 'day' e K 24 e'
// identico a walkForward.
function eloRun(days, roster, K, size) {
  const ratings = new Map(roster.map(p => [p, Elo.ELO_START]));
  const expectedA = (a, b) => 1 / (1 + Math.pow(10, (ratings.get(b) - ratings.get(a)) / 400));
  const records = [];

  days.forEach(({ games }, day) => {
    chunksOf(games, size).forEach(chunk => {
      chunk.forEach(match => {
        records.push({ day, y: match.vincitore === match.giocatore1 ? 1 : 0, p: expectedA(match.giocatore1, match.giocatore2) });
      });
      chunk.forEach(match => {
        const a = match.giocatore1;
        const b = match.giocatore2;
        const delta = K * ((match.vincitore === a ? 1 : 0) - expectedA(a, b));
        ratings.set(a, ratings.get(a) + delta);
        ratings.set(b, ratings.get(b) - delta);
      });
    });
  });

  return records;
}

function configLabel(c) {
  return `RD ${c.INITIAL_RD}, σ ${c.INITIAL_VOLATILITY}, τ ${c.TAU}, periodo ${periodLabel(c.period)}`;
}

// Log-loss sulle giornate di taratura (prima del taglio) e di verifica (dopo)
function splitLoss(records, split) {
  const train = records.filter(r => r.day < split);
  const test = records.filter(r => r.day >= split);
  return { train: METRICS.logLoss(train, 'p'), test: METRICS.logLoss(test, 'p') };
}

// Unisce le previsioni di piu' run (stesse partite, stesso ordine) in record
// con una chiave per run, per le tabelle e il bootstrap
function merge(runs) {
  const [first] = Object.values(runs);
  return first.map((r, i) => {
    const merged = { day: r.day, y: r.y };
    Object.entries(runs).forEach(([key, run]) => { merged[key] = run[i].p; });
    return merged;
  });
}

function tune(days, roster, truth) {
  const split = Math.floor(days.length * TRAIN_SHARE);
  console.log(`\n\n######## TARATURA ########`);
  console.log(`Taratura sulle giornate 1-${split} (${days[0].day} → ${days[split - 1].day}), verifica sulle giornate ${split + 1}-${days.length} (${days[split].day} → ${days[days.length - 1].day}).`);
  console.log('I rating si scaldano su tutto lo storico; cambia solo quali partite contano nel punteggio. La scelta si fa sulla taratura: la verifica dice quanto regge.');

  const current = { ...Rating.RATING_CONFIG, period: 'day' };
  const glicko = [];
  PERIODS.forEach(period => GRID.INITIAL_RD.forEach(INITIAL_RD => GRID.INITIAL_VOLATILITY.forEach(INITIAL_VOLATILITY => GRID.TAU.forEach(TAU => {
    const config = { ...Rating.RATING_CONFIG, INITIAL_RD, RD_CAP: INITIAL_RD, INITIAL_VOLATILITY, TAU, period };
    const run = glickoRun(days, config, period);
    glicko.push({ config, run, ...splitLoss(run, split) });
  }))));
  glicko.sort((x, y) => x.train - y.train);

  const isCurrent = c => c.period === 'day' && ['INITIAL_RD', 'INITIAL_VOLATILITY', 'TAU', 'RD_CAP'].every(k => c[k] === current[k]);
  const currentEntry = glicko.find(e => isCurrent(e.config));
  const best = glicko[0];

  const elo = [];
  PERIODS.forEach(period => ELO_KS.forEach(K => {
    const run = eloRun(days, roster, K, period);
    elo.push({ K, period, run, ...splitLoss(run, split) });
  }));
  elo.sort((x, y) => x.train - y.train);
  const eloCurrent = elo.find(e => e.K === Elo.ELO_K && e.period === 'day');
  const eloBest = elo[0];

  const row = (e, rank) => ({ posizione: rank, 'log-loss taratura': +e.train.toFixed(4), 'log-loss verifica': +e.test.toFixed(4) });
  const reference = { 'Base (50%)': { 'log-loss verifica': +Math.log(2).toFixed(4) } };
  if (truth) {
    const trueRun = days.flatMap(({ games }, day) => games.map(m => ({
      day,
      y: m.vincitore === m.giocatore1 ? 1 : 0,
      p: 1 / (1 + Math.pow(10, (truth.get(m.giocatore2) - truth.get(m.giocatore1)) / 400))
    })));
    reference['Forza vera'] = { 'log-loss verifica': +splitLoss(trueRun, split).test.toFixed(4) };
  }

  console.log(`\n== Glicko-2: le 10 configurazioni migliori in taratura (su ${glicko.length}) ==`);
  const top = {};
  glicko.slice(0, 10).forEach((e, i) => { top[configLabel(e.config)] = row(e, i + 1); });
  top[`${configLabel(currentEntry.config)} (attuale)`] = row(currentEntry, glicko.indexOf(currentEntry) + 1);
  console.table(top);

  console.log('== Glicko-2: effetto di ciascun parametro (miglior log-loss di taratura con quel valore) ==');
  const marginal = {};
  [['INITIAL_RD', GRID.INITIAL_RD], ['INITIAL_VOLATILITY', GRID.INITIAL_VOLATILITY], ['TAU', GRID.TAU], ['period', PERIODS]].forEach(([key, values]) => {
    values.forEach(value => {
      const bestWith = glicko.find(e => e.config[key] === value);
      marginal[`${key} = ${key === 'period' ? periodLabel(value) : value}`] = row(bestWith, glicko.indexOf(bestWith) + 1);
    });
  });
  console.table(marginal);

  console.log('== Elo: K e periodo (ordinati per taratura) ==');
  const eloTable = {};
  elo.forEach((e, i) => { eloTable[`K ${e.K}, periodo ${periodLabel(e.period)}${e === eloCurrent ? ' (attuale)' : ''}`] = row(e, i + 1); });
  console.table(eloTable);

  console.log('== Riferimenti sulla verifica ==');
  console.table(reference);

  const bestGlickoName = `Glicko-2 tarato (${configLabel(best.config)})`;
  const bestEloName = `Elo tarato (K ${eloBest.K}, periodo ${periodLabel(eloBest.period)})`;
  const records = merge({ gBest: best.run, gCur: currentEntry.run, eBest: eloBest.run, eCur: eloCurrent.run });
  const test = records.filter(r => r.day >= split);

  console.log(`\n== Sulla verifica (${test.length} partite, ${days.length - split} giornate) ==`);
  console.table(modelTable(test, {
    [bestGlickoName]: 'gBest',
    'Glicko-2 attuale': 'gCur',
    [bestEloName]: 'eBest',
    'Elo attuale (K 24)': 'eCur'
  }));

  console.log('Differenze di log-loss sulla verifica, bootstrap sulle giornate (positivo = il primo e\' meglio)');
  const ll = key => rs => METRICS.logLoss(rs, key);
  const vs = (a, b) => rs => ll(b)(rs) - ll(a)(rs);
  console.table({
    'Glicko tarato vs Elo tarato': bootstrap(test, vs('gBest', 'eBest')),
    'Glicko tarato vs Glicko attuale': bootstrap(test, vs('gBest', 'gCur')),
    'Elo tarato vs Elo attuale': bootstrap(test, vs('eBest', 'eCur')),
    'Glicko attuale vs Elo attuale': bootstrap(test, vs('gCur', 'eCur'))
  });

  console.log(`\n== Calibrazione del Glicko-2 tarato sulla verifica ==`);
  console.table(calibrationTable(test, 'gBest'));
  console.log(`== Calibrazione dell'Elo tarato sulla verifica ==`);
  console.table(calibrationTable(test, 'eBest'));

  // Classifica: con il Glicko tarato conta ancora sottrarre 2·RD?
  const ordered = glickoRun(days, best.config, best.config.period, true)
    .map((r, i) => ({ ...r, orders: { ...r.orders, [bestEloName]: Math.sign(eloBest.run[i].p - 0.5) } }))
    .filter(r => r.day >= split);
  console.log('== Classifiche col Glicko tarato, sulla verifica: quanto spesso vince chi sta piu\' in alto ==');
  console.table(orderTable(ordered));
}

// ---------------------------------------------------------------------------
// Esecuzione
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const withTune = args.includes('--tune');
  const arg = args.find(a => a !== '--tune');
  if (!arg) {
    console.error('Uso: node tools/compare-ratings.mjs <snapshot.json> | --synthetic [--tune]');
    process.exit(1);
  }

  const { matches, roster, truth } = arg === '--synthetic' ? synthetic() : loadSnapshot(arg);
  const anomalies = Rating.validateLog(matches, roster);
  const ordered = Rating.chronologicalMatches(matches);
  const days = groupByDay(ordered, roster);
  const { records, state } = walkForward(ordered, roster, days, Rating.RATING_CONFIG, true, truth);

  console.log(`\n${matches.length} righe, ${records.length} partite valide in ${days.length} giornate, ${roster.length} giocatori`);
  if (anomalies.length) console.log(`${anomalies.length} anomalie (le righe non valide sono escluse):`, anomalies.map(a => `riga ${a.row}: ${a.problem}`));

  // Il walk-forward deve arrivare allo stesso stato del replay della pagina
  const replayed = Rating.replay(ordered, roster).state;
  const same = replayed.size === state.size && [...replayed].every(([name, p]) => {
    const q = state.get(name);
    return q && q.mu === p.mu && q.phi === p.phi && q.sigma === p.sigma;
  });
  console.log(`Controllo coerenza con Rating.replay: ${same ? 'OK' : 'DIVERSO'}`);
  if (!same) process.exitCode = 1;

  records.forEach(r => { r.pBase = 0.5; });
  const models = { 'Glicko-2': 'pGlicko', 'Elo classico': 'pElo', 'Base (50%)': 'pBase' };
  if (truth) models['Forza vera'] = 'pTrue';

  const settled = records.filter(r => r.bothSettled);
  const subsets = [['Tutte le partite', records], ['Solo tra non provvisori', settled]];

  subsets.forEach(([title, rs]) => {
    if (rs.length === 0) return;
    console.log(`\n== ${title} ==\nPrevisioni (log-loss e Brier: piu' bassi = meglio)`);
    console.table(modelTable(rs, models));
    console.log('Classifiche: quanto spesso vince chi sta piu\' in alto');
    console.table(orderTable(rs));
  });

  console.log('\n== Calibrazione Glicko-2 (prevista vs osservata) ==');
  console.table(calibrationTable(records, 'pGlicko'));
  console.log('== Calibrazione Elo classico ==');
  console.table(calibrationTable(records, 'pElo'));

  console.log('\n== Differenze con intervallo bootstrap sulle giornate ==');
  const current = 'Rating (r − 2·RD)';
  const diffs = {
    'Glicko-2 vs Elo (log-loss, Elo − Glicko)': rs => METRICS.logLoss(rs, 'pElo') - METRICS.logLoss(rs, 'pGlicko')
  };
  ['Rating grezzo', 'Elo classico', 'Elo attivi'].forEach(name => {
    diffs[`${name} vs ${current} (classifica)`] = rs => METRICS.order(rs, name) - METRICS.order(rs, current);
  });
  const table = {};
  Object.entries(diffs).forEach(([name, diff]) => { table[name] = bootstrap(records, diff); });
  console.table(table);
  console.log('Differenza positiva = il primo sistema e\' meglio. "non distinguibile" = l\'intervallo contiene 0.');

  console.log('\n== Glicko-2 al variare di TAU (log-loss, tutte le partite) ==');
  const tauTable = {};
  TAUS.forEach(TAU => {
    const config = { ...Rating.RATING_CONFIG, TAU };
    const run = walkForward(ordered, roster, days, config, false).records;
    tauTable[`TAU ${TAU}${TAU === Rating.RATING_CONFIG.TAU ? ' (attuale)' : ''}`] = { 'log-loss': +METRICS.logLoss(run, 'pGlicko').toFixed(6) };
  });
  console.table(tauTable);

  if (withTune) tune(days, roster, truth);
}

main();
