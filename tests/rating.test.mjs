// Casi di accettazione della specifica Glicko-2. Eseguire con: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Rating from '../rating.js';

const {
  RATING_CONFIG, dayKey, chronologicalMatches, validateLog, glickoUpdate, growPhi,
  toInternal, toDisplay, closePeriod, viewOf, replay, matchDeltas
} = Rating;

const match = (data, giocatore1, giocatore2, vincitore = giocatore1) => ({ data, giocatore1, giocatore2, vincitore });
const run = (matches, roster) => replay(chronologicalMatches(matches), roster);

// Esempio di Glickman, con il centro della scala come parametro
function glickmanExample(config) {
  const c = config.INITIAL_RATING;
  const opponent = (r, rd, score) => ({ ...toInternal(c + r, rd, config), score });
  const updated = glickoUpdate(
    { ...toInternal(c, 200, config), sigma: 0.06 },
    [opponent(-100, 30, 1), opponent(50, 100, 0), opponent(200, 300, 0)],
    config
  );
  return { ...toDisplay(updated.mu, updated.phi, config), sigma: updated.sigma };
}

function permutations(list) {
  if (list.length <= 1) return [list];
  return list.flatMap((x, i) => permutations([...list.slice(0, i), ...list.slice(i + 1)]).map(p => [x, ...p]));
}

test('esempio di riferimento di Glickman (centro 1000)', () => {
  const { rating, rd, sigma } = glickmanExample(RATING_CONFIG);
  assert.ok(Math.abs(rating - 964.06) < 0.01, `r' = ${rating}`);
  assert.ok(Math.abs(rd - 151.52) < 0.01, `RD' = ${rd}`);
  assert.ok(Math.abs(sigma - 0.05999) < 0.00001, `sigma' = ${sigma}`);
});

test('esempio di Glickman passando da closePeriod, con i rating di inizio periodo', () => {
  const at = (r, rd) => ({ ...toInternal(r, rd), sigma: 0.06, played: 1, wins: 0, lastPeriod: 0 });
  const state = new Map([['P', at(1000, 200)], ['A', at(900, 30)], ['B', at(1050, 100)], ['C', at(1200, 300)]]);
  const next = closePeriod(state, 1, [
    { winner: 'P', loser: 'A' }, { winner: 'B', loser: 'P' }, { winner: 'C', loser: 'P' }
  ]);
  const p = viewOf(next, 1, 'P');
  assert.ok(Math.abs(p.rating - 964.06) < 0.01, `r' = ${p.rating}`);
  assert.ok(Math.abs(p.rd - 151.52) < 0.01, `RD' = ${p.rd}`);
});

test('invarianza di scala (centro 1500 di Glickman)', () => {
  const base = glickmanExample(RATING_CONFIG);
  const shifted = glickmanExample({ ...RATING_CONFIG, INITIAL_RATING: 1500 });
  assert.ok(Math.abs(shifted.rating - 1464.06) < 0.01, `r' = ${shifted.rating}`);
  assert.equal(shifted.rd, base.rd);
  assert.equal(shifted.sigma, base.sigma);
});

test('indipendenza dall\'ordine: ogni permutazione delle partite del giorno', () => {
  const history = [
    match('01/09/2026', 'Anna', 'Bruno'),
    match('01/09/2026', 'Carla', 'Dario'),
    match('01/09/2026', 'Anna', 'Carla', 'Carla')
  ];
  const day = [
    match('02/09/2026', 'Anna', 'Bruno', 'Bruno'),
    match('02/09/2026', 'Anna', 'Bruno'),
    match('02/09/2026', 'Carla', 'Anna'),
    match('02/09/2026', 'Dario', 'Bruno'),
    match('02/09/2026', 'Carla', 'Dario', 'Dario')
  ];
  const expected = run([...history, ...day]).state;

  permutations(day).forEach(perm => {
    assert.deepEqual(run([...history, ...perm]).state, expected);
  });
});

test('inattività: forma chiusa uguale a 30 passi singoli, RD ~ 82.8', () => {
  const phi = 60 / RATING_CONFIG.SCALE;
  let stepped = phi;
  for (let i = 0; i < 30; i++) stepped = Math.sqrt(stepped * stepped + 0.06 * 0.06);

  const closed = growPhi(phi, 0.06, 30);
  assert.ok(Math.abs(closed - stepped) < 1e-12);
  assert.ok(Math.abs(closed * RATING_CONFIG.SCALE - 82.8) < 0.05, `RD = ${closed * RATING_CONFIG.SCALE}`);
});

test('tetto RD: la RD non supera mai 350', () => {
  assert.ok(growPhi(50 / RATING_CONFIG.SCALE, 0.06, 1e6) * RATING_CONFIG.SCALE <= 350);

  // Un giocatore che smette mentre gli altri giocano per 400 giornate attive
  const matches = [match('01/01/2025', 'Anna', 'Bruno')];
  for (let d = 0; d < 400; d++) {
    const day = new Date(Date.UTC(2025, 0, 2 + d)).toISOString().slice(0, 10).split('-').reverse().join('/');
    matches.push(match(day, 'Carla', 'Dario'));
  }
  const { state, period } = run(matches);
  assert.ok(viewOf(state, period, 'Anna').rd <= 350);
});

test('solo giornate attive: un weekend senza partite non fa crescere la RD', () => {
  // Venerdi' e lunedi', contro venerdi' e sabato: stessi stati
  const withWeekend = run([match('04/09/2026', 'Anna', 'Bruno'), match('07/09/2026', 'Anna', 'Bruno', 'Bruno')]);
  const consecutive = run([match('04/09/2026', 'Anna', 'Bruno'), match('05/09/2026', 'Anna', 'Bruno', 'Bruno')]);
  assert.deepEqual(withWeekend.state, consecutive.state);

  // Saltare una giornata attiva invece la fa crescere
  const skipped = run([match('04/09/2026', 'Anna', 'Bruno'), match('07/09/2026', 'Carla', 'Dario')]);
  const played = run([match('04/09/2026', 'Anna', 'Bruno')]);
  assert.ok(viewOf(skipped.state, skipped.period, 'Anna').rd > viewOf(played.state, played.period, 'Anna').rd);
});

test('determinismo del replay: due replay identici bit per bit', () => {
  const matches = [
    match('01/09/2026', 'Anna', 'Bruno'),
    match('01/09/2026', 'Bruno', 'Carla'),
    match('03/09/2026', 'Carla', 'Anna', 'Anna'),
    match('08/09/2026', 'Dario', 'Anna')
  ];
  assert.deepEqual(run(matches), run(matches));
});

test('aggiornamento live partita per partita uguale al replay completo', () => {
  const matches = chronologicalMatches([
    match('01/09/2026', 'Anna', 'Bruno'),
    match('01/09/2026', 'Bruno', 'Carla'),
    match('02/09/2026', 'Carla', 'Anna', 'Anna'),
    match('02/09/2026', 'Anna', 'Bruno', 'Bruno'),
    match('02/09/2026', 'Dario', 'Carla'),
    match('05/09/2026', 'Dario', 'Anna')
  ]);

  // Snapshot a fine giornata + ricalcolo della giornata corrente a ogni partita
  let snapshot = new Map();
  let tentative = snapshot;
  let period = -1;
  let day = null;
  let today = [];

  matches.forEach(({ match: m, day: d }) => {
    if (d !== day) {
      snapshot = tentative;
      period++;
      day = d;
      today = [];
    }
    today.push({ winner: m.vincitore, loser: m.vincitore === m.giocatore1 ? m.giocatore2 : m.giocatore1 });
    tentative = closePeriod(snapshot, period, today);
  });

  const full = replay(matches);
  assert.deepEqual(tentative, full.state);
  assert.equal(period, full.period);
});

test('confine di giornata: 23:59 e 00:01 locali in periodi diversi', () => {
  // Europe/Rome in ora legale (UTC+2)
  assert.equal(dayKey('2026-09-30T21:59:00Z'), '2026-09-30');
  assert.equal(dayKey('2026-09-30T22:01:00Z'), '2026-10-01');
  // Fine ora legale, 25/10/2026 (giornata di 25 ore): 23:59 CET = 22:59Z
  assert.equal(dayKey('2026-10-25T22:59:00Z'), '2026-10-25');
  assert.equal(dayKey('2026-10-25T23:01:00Z'), '2026-10-26');
  // Inizio ora legale, 29/03/2026 (giornata di 23 ore)
  assert.equal(dayKey('2026-03-28T22:59:00Z'), '2026-03-28');
  assert.equal(dayKey('2026-03-28T23:01:00Z'), '2026-03-29');
  // Mezzanotte locale come la manda il foglio, e la gg/mm/aaaa letta com'e'
  assert.equal(dayKey('2026-09-01T22:00:00.000Z'), '2026-09-02');
  assert.equal(dayKey('03/09/2026'), '2026-09-03');

  const { byDay } = run([
    match('2026-09-30T21:59:00Z', 'Anna', 'Bruno'),
    match('2026-09-30T22:01:00Z', 'Anna', 'Bruno')
  ]);
  assert.equal(byDay.length, 2);
});

test('stesso giocatore da entrambe le parti: rifiutato', () => {
  const selfPlay = match('01/09/2026', 'Anna', 'Anna');
  const anomalies = validateLog([selfPlay, match('01/09/2026', 'Anna', 'Bruno')], ['Anna', 'Bruno']);
  assert.deepEqual(anomalies.map(a => a.row), [0]);

  const { state } = run([selfPlay]);
  assert.equal(state.size, 0);
});

test('validazione: data illeggibile, fuori rosa, vincitore non valido', () => {
  const anomalies = validateLog([
    match('', 'Anna', 'Bruno'),
    match('01/09/2026', 'Anna', 'Zeno'),
    match('01/09/2026', 'Anna', 'Bruno', 'Carla')
  ], ['Anna', 'Bruno', 'Carla']);
  assert.deepEqual(anomalies.map(a => a.row), [0, 1, 2]);
});

test('provvisorio: badge finché RD > 150, tolto dopo', () => {
  const matches = [];
  let seenProvisional = false;
  let cleared = false;

  for (let d = 1; d <= 28 && !cleared; d++) {
    const day = `${String(d).padStart(2, '0')}/02/2026`;
    matches.push(match(day, 'Anna', 'Bruno'), match(day, 'Anna', 'Bruno', 'Bruno'), match(day, 'Anna', 'Carla'));

    const { state, period } = run(matches);
    const anna = viewOf(state, period, 'Anna');
    assert.equal(anna.provisional, anna.rd > 150);
    if (anna.provisional) seenProvisional = true;
    else cleared = true;
  }

  assert.ok(seenProvisional && cleared);
});

test('delta per partita: diversi per i due giocatori, somma = variazione di giornata', () => {
  const matches = [
    match('01/09/2026', 'Anna', 'Bruno'),
    match('01/09/2026', 'Anna', 'Carla'),
    match('02/09/2026', 'Anna', 'Bruno', 'Bruno'),
    match('02/09/2026', 'Carla', 'Anna'),
    match('02/09/2026', 'Anna', 'Bruno')
  ];
  const ordered = chronologicalMatches(matches);
  const deltas = matchDeltas(ordered);
  const first = deltas.get(matches[0]);
  assert.notEqual(first.get('Anna'), -first.get('Bruno'));

  const day1 = replay(chronologicalMatches(matches.slice(0, 2)));
  const day2 = replay(ordered);
  const annaSum = matches.slice(2).reduce((s, m) => s + deltas.get(m).get('Anna'), 0);
  const expected = viewOf(day2.state, 1, 'Anna').score - viewOf(day1.state, 0, 'Anna').score;
  assert.ok(Math.abs(annaSum - expected) < 1e-9);
});
