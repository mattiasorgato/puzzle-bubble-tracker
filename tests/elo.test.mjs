// Vista "Elo classico". Eseguire con: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Elo from '../elo.js';
import Rating from '../rating.js';

const match = (data, giocatore1, giocatore2, vincitore = giocatore1) => ({ data, giocatore1, giocatore2, vincitore });
const rank = (matches, players) => Elo.eloRanking(Rating.chronologicalMatches(matches), players);

test('somma zero: i rating sommano sempre a 1000 per giocatore', () => {
  const ranking = rank([
    match('01/09/2026', 'Anna', 'Bruno'),
    match('01/09/2026', 'Bruno', 'Carla'),
    match('02/09/2026', 'Carla', 'Anna', 'Anna'),
    match('03/09/2026', 'Anna', 'Bruno', 'Bruno')
  ], ['Anna', 'Bruno', 'Carla']);

  const sum = ranking.reduce((s, r) => s + r.rating, 0);
  assert.ok(Math.abs(sum - 3 * Elo.ELO_START) < 1e-9);
});

test('righe non valide saltate: fuori rosa, stesso giocatore, vincitore estraneo', () => {
  const ranking = rank([
    match('01/09/2026', 'Anna', 'Zeno'),
    match('01/09/2026', 'Anna', 'Anna'),
    match('01/09/2026', 'Anna', 'Bruno', 'Carla')
  ], ['Anna', 'Bruno', 'Carla']);

  assert.deepEqual(ranking, []);
});

test('ordine: rating, poi vittorie, poi partite, poi nome', () => {
  // Due partite indipendenti tra esordienti: i due vincitori finiscono a pari
  // rating (1012), come i due sconfitti (988), quindi a parita' decide il nome.
  const ranking = rank([
    match('01/09/2026', 'Carla', 'Dario'),
    match('01/09/2026', 'Bruno', 'Anna')
  ], ['Anna', 'Bruno', 'Carla', 'Dario']);

  assert.deepEqual(ranking.map(r => r.player), ['Bruno', 'Carla', 'Anna', 'Dario']);
  assert.deepEqual(ranking.map(r => `${r.wins}-${r.losses}`), ['1-0', '1-0', '0-1', '0-1']);
});
