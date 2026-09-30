// Report di migrazione: vecchio Elo contro Glicko-2 sugli stessi dati.
//
//   curl -sL "<APPS_SCRIPT_URL di index.html>" -o dati.json
//   node tools/compare-ratings.mjs dati.json
//
// Il fetch di Node verso l'endpoint riceve una pagina HTML di Google invece
// del JSON, curl no: per questo il tool legge un export salvato.
//
// Prima valida lo storico: se ci sono anomalie le elenca ed esce con codice 1
// senza fare il confronto, perche' vanno corrette sul foglio prima.
import { readFile } from 'node:fs/promises';
import Rating from '../rating.js';
import Elo from '../elo.js';

const source = process.argv[2];
if (!source) {
  console.error('Uso: node tools/compare-ratings.mjs dati.json');
  process.exit(2);
}

const { matches, players: roster } = JSON.parse(await readFile(source, 'utf8'));

// Stessa rosa della pagina: se il foglio non la manda, chi compare nelle partite
const players = roster && roster.length
  ? roster
  : [...new Set(matches.flatMap(m => [m.giocatore1, m.giocatore2]))].sort();

const anomalies = Rating.validateLog(matches, players);
if (anomalies.length) {
  console.error(`${anomalies.length} anomalie nello storico, da correggere prima del confronto:`);
  anomalies.forEach(({ row, match, problem }) => {
    console.error(`  partita #${row + 1} (${match.data} ${match.giocatore1} - ${match.giocatore2}, vince ${match.vincitore}): ${problem}`);
  });
  process.exit(1);
}

const ordered = Rating.chronologicalMatches(matches);
const elo = Elo.eloRanking(ordered, players);
const { state, period } = Rating.replay(ordered, players);
const glicko = Rating.standings(state, period);

const eloRank = new Map(elo.map((e, i) => [e.player, { rank: i + 1, rating: e.rating }]));

console.log(`${matches.length} partite, ${period + 1} giornate attive, ${glicko.length} giocatori\n`);
console.table(glicko.map((g, i) => {
  const old = eloRank.get(g.player);
  return {
    Giocatore: g.player,
    'W-L': `${g.wins}-${g.losses}`,
    '# Elo': old.rank,
    Elo: Math.round(old.rating),
    '# nuovo': i + 1,
    Rating: Math.round(g.score),
    'r ± RD': `${Math.round(g.rating)} ± ${Math.round(g.rd)}`,
    Provvisorio: g.provisional ? 'sì' : ''
  };
}));
