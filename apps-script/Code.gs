/**
 * Puzzle Bubble Tracker — Web App per Google Sheets.
 *
 * COSA CAMBIA RISPETTO ALLA VERSIONE PRECEDENTE
 *   1. doGet restituisce anche `players`, letto dalla tab "Leaderboard": e' la
 *      Leaderboard, non il match log, a decidere chi puo' giocare.
 *   2. doPost accetta { action: "addPlayer", nome } e aggiunge una riga alla
 *      Leaderboard. Senza `action` la POST resta una partita, esattamente come
 *      prima, quindi una pagina vecchia continua a funzionare con questo script.
 *
 * COME INSTALLARLO (interfaccia in italiano)
 *   1. Nel foglio: Estensioni > Apps Script.
 *   2. Incolla questo file al posto del contenuto attuale e salva.
 *   3. Pulsante "Deployment" in alto a destra > "Gestisci deployment".
 *   4. Seleziona il deployment attivo e premi l'icona a matita (Modifica).
 *   5. Nel menu a tendina "Versione" scegli "Nuova versione".
 *   6. Conferma con "Esegui il deployment".
 *
 *   Va usato "Gestisci deployment", NON "Nuovo deployment": il primo aggiorna
 *   il deployment esistente e lascia intatto l'URL, il secondo ne crea uno con
 *   un URL diverso, e la pagina continuerebbe a parlare con il vecchio finche'
 *   non si cambia APPS_SCRIPT_URL in index.html.
 *
 *   Senza il passaggio "Nuova versione" la Web App continua a servire il codice
 *   di prima anche dopo aver salvato: e' la versione, non il salvataggio, a
 *   decidere cosa viene pubblicato.
 *
 *   "Verifica deployment" serve solo a provare il codice piu' recente su un URL
 *   temporaneo che richiede il login: utile per un controllo al volo, ma non e'
 *   l'URL che usa la pagina.
 *
 *   Al primo salvataggio Google puo' chiedere di nuovo l'autorizzazione ad
 *   accedere al foglio: e' normale, va concessa.
 *
 * NOTA: le colonne vengono trovate per intestazione, non per posizione, quindi
 * riordinarle nel foglio non rompe nulla. Se le tue intestazioni hanno nomi
 * diversi da quelli previsti, aggiungili alle liste qui sotto.
 */

var LEADERBOARD_SHEET = 'Leaderboard';

// Intestazioni riconosciute, in minuscolo e senza spazi ai bordi.
var NAME_HEADERS = ['giocatore', 'nome', 'player', 'name'];
var MATCH_HEADERS = {
  data: ['data', 'date'],
  giocatore1: ['giocatore1', 'giocatore 1', 'player1'],
  giocatore2: ['giocatore2', 'giocatore 2', 'player2'],
  vincitore: ['vincitore', 'winner']
};

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function norm_(value) {
  return String(value == null ? '' : value).trim().toLowerCase();
}

/** Indice (0-based) della prima colonna la cui intestazione e' fra `names`. */
function columnIndex_(headers, names) {
  for (var i = 0; i < headers.length; i++) {
    if (names.indexOf(norm_(headers[i])) !== -1) return i;
  }
  return -1;
}

/** Il foglio delle partite: quello che ha una colonna "vincitore". */
function matchSheet_() {
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();

  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getLastRow() < 1) continue;
    var headers = sheets[i].getRange(1, 1, 1, sheets[i].getLastColumn()).getValues()[0];
    if (columnIndex_(headers, MATCH_HEADERS.vincitore) !== -1) return sheets[i];
  }

  // Nessuna intestazione riconosciuta: si ripiega sul primo foglio, che e'
  // dov'era il match log prima che questo script guardasse le intestazioni.
  return sheets[0];
}

function leaderboardSheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LEADERBOARD_SHEET);
}

/**
 * Nomi dalla Leaderboard. La colonna e' quella con l'intestazione giusta; se
 * nessuna intestazione e' riconoscibile si usa la prima colonna, saltando la
 * riga di intestazione.
 */
function readPlayers_() {
  var sheet = leaderboardSheet_();
  if (!sheet || sheet.getLastRow() < 2) return [];

  var values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  var col = columnIndex_(values[0], NAME_HEADERS);
  if (col === -1) col = 0;

  var seen = {};
  var out = [];

  for (var r = 1; r < values.length; r++) {
    var name = String(values[r][col] == null ? '' : values[r][col]).trim();
    if (!name) continue;

    var key = name.toLowerCase();
    if (seen[key]) continue;

    seen[key] = true;
    out.push(name);
  }

  return out;
}

function readMatches_() {
  var sheet = matchSheet_();
  if (!sheet || sheet.getLastRow() < 2) return [];

  var values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  var headers = values[0];

  var cols = {
    data: columnIndex_(headers, MATCH_HEADERS.data),
    giocatore1: columnIndex_(headers, MATCH_HEADERS.giocatore1),
    giocatore2: columnIndex_(headers, MATCH_HEADERS.giocatore2),
    vincitore: columnIndex_(headers, MATCH_HEADERS.vincitore)
  };

  // Se il foglio non ha intestazioni riconoscibili si torna all'ordine storico
  // delle colonne: data, giocatore1, giocatore2, vincitore.
  var fallback = { data: 0, giocatore1: 1, giocatore2: 2, vincitore: 3 };
  Object.keys(cols).forEach(function (key) {
    if (cols[key] === -1) cols[key] = fallback[key];
  });

  var out = [];

  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var g1 = String(row[cols.giocatore1] == null ? '' : row[cols.giocatore1]).trim();
    var g2 = String(row[cols.giocatore2] == null ? '' : row[cols.giocatore2]).trim();
    if (!g1 || !g2) continue;

    out.push({
      data: row[cols.data],
      giocatore1: g1,
      giocatore2: g2,
      vincitore: String(row[cols.vincitore] == null ? '' : row[cols.vincitore]).trim()
    });
  }

  return out;
}

function doGet() {
  try {
    return json_({ success: true, matches: readMatches_(), players: readPlayers_() });
  } catch (err) {
    return json_({ success: false, error: String(err) });
  }
}

function addPlayer_(nome) {
  var name = String(nome == null ? '' : nome).trim();

  if (!name) return { success: false, error: 'Nome vuoto.' };
  if (name.length > 60) return { success: false, error: 'Nome troppo lungo.' };

  var sheet = leaderboardSheet_();
  if (!sheet) {
    return { success: false, error: 'Foglio "' + LEADERBOARD_SHEET + '" non trovato.' };
  }

  // Il lock evita che due aggiunte simultanee finiscano sulla stessa riga o
  // che il controllo sui duplicati veda una lista gia' superata.
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    var existing = readPlayers_();
    for (var i = 0; i < existing.length; i++) {
      if (existing[i].toLowerCase() === name.toLowerCase()) {
        return { success: false, error: '"' + existing[i] + '" e\' gia\' in lista.' };
      }
    }

    var headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
    var col = columnIndex_(headers, NAME_HEADERS);
    if (col === -1) col = 0;

    var lastRow = sheet.getLastRow();
    var newRow = lastRow + 1;

    sheet.getRange(newRow, col + 1).setValue(name);

    // Il nome da solo non basta: le colonne calcolate (vittorie, sconfitte...)
    // resterebbero vuote, e il giocatore comparirebbe in Leaderboard senza
    // statistiche. Le formule si ricopiano dalla riga sopra.
    var formule = fillRowFormulas_(sheet, newRow, lastRow, col);

    return { success: true, nome: name, formule: formule };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Ricopia nella riga nuova le formule della riga modello, saltando la colonna
 * del nome. Si usa il formato R1C1 proprio perche' i riferimenti relativi si
 * riadattano da soli alla riga di destinazione: copiando la formula in A1 si
 * porterebbe dietro i riferimenti della riga di partenza.
 *
 * Ogni cella viene scritta singolarmente invece che in blocco: un
 * `setFormulasR1C1` sull'intera riga scriverebbe stringhe vuote sulle celle
 * senza formula, cancellando il nome appena inserito.
 */
function fillRowFormulas_(sheet, newRow, lastRow, skipCol) {
  var template = formulaTemplateRow_(sheet, lastRow, skipCol);
  if (!template) return 0;

  var filled = 0;

  for (var c = 0; c < template.length; c++) {
    if (c === skipCol || !template[c]) continue;
    sheet.getRange(newRow, c + 1).setFormulaR1C1(template[c]);
    filled++;
  }

  return filled;
}

/**
 * Cerca all'indietro la riga piu' recente che contenga almeno una formula, e ne
 * restituisce le formule in R1C1. Non ci si ferma alla riga immediatamente
 * precedente: se quella fosse stata inserita prima che questo codice esistesse
 * sarebbe senza formule, e da li' in poi non se ne recupererebbero mai piu'.
 */
function formulaTemplateRow_(sheet, lastRow, skipCol) {
  var width = Math.max(1, sheet.getLastColumn());

  for (var r = lastRow; r >= 2; r--) {
    var formulas = sheet.getRange(r, 1, 1, width).getFormulasR1C1()[0];

    for (var c = 0; c < width; c++) {
      if (c !== skipCol && formulas[c]) return formulas;
    }
  }

  return null;
}

function addMatch_(body) {
  var sheet = matchSheet_();
  if (!sheet) return { success: false, error: 'Foglio delle partite non trovato.' };

  var g1 = String(body.giocatore1 == null ? '' : body.giocatore1).trim();
  var g2 = String(body.giocatore2 == null ? '' : body.giocatore2).trim();
  var vincitore = String(body.vincitore == null ? '' : body.vincitore).trim();

  if (!g1 || !g2) return { success: false, error: 'Servono due giocatori.' };
  if (g1 === g2) return { success: false, error: 'I due giocatori devono essere diversi.' };
  if (vincitore !== g1 && vincitore !== g2) {
    return { success: false, error: 'Il vincitore deve essere uno dei due giocatori.' };
  }

  var headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
  var cols = {
    data: columnIndex_(headers, MATCH_HEADERS.data),
    giocatore1: columnIndex_(headers, MATCH_HEADERS.giocatore1),
    giocatore2: columnIndex_(headers, MATCH_HEADERS.giocatore2),
    vincitore: columnIndex_(headers, MATCH_HEADERS.vincitore)
  };

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    var row = sheet.getLastRow() + 1;
    var width = Math.max(4, sheet.getLastColumn());
    var values = new Array(width);
    for (var i = 0; i < width; i++) values[i] = '';

    // La data resta la stringa gg/mm/aaaa che manda la pagina: con il foglio in
    // locale italiano Sheets la interpreta come data vera. Scrivere un ISO la
    // lascerebbe come testo, disallineata dalle altre righe.
    values[cols.data === -1 ? 0 : cols.data] = body.data;
    values[cols.giocatore1 === -1 ? 1 : cols.giocatore1] = g1;
    values[cols.giocatore2 === -1 ? 2 : cols.giocatore2] = g2;
    values[cols.vincitore === -1 ? 3 : cols.vincitore] = vincitore;

    sheet.getRange(row, 1, 1, width).setValues([values]);

    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    // Senza `action` e' una partita: e' cosi' che si comportava lo script
    // precedente, e una pagina non aggiornata continua a funzionare.
    if (body.action === 'addPlayer') return json_(addPlayer_(body.nome));

    return json_(addMatch_(body));
  } catch (err) {
    return json_({ success: false, error: String(err) });
  }
}

/**
 * Rinomina un giocatore nel match log. Tocca SOLO le tre colonne dei nomi e
 * solo le celle che cambiano davvero: riscrivere l'intero foglio passerebbe
 * anche dalla colonna data e, dove ci fosse una formula, la sostituirebbe con
 * il valore che aveva al momento della lettura.
 */
function renamePlayer_(oldName, newName) {
  var sheet = matchSheet_();
  if (!sheet || sheet.getLastRow() < 2) return 0;

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var fallback = [1, 2, 3];
  var cols = [
    columnIndex_(headers, MATCH_HEADERS.giocatore1),
    columnIndex_(headers, MATCH_HEADERS.giocatore2),
    columnIndex_(headers, MATCH_HEADERS.vincitore)
  ].map(function (col, i) { return col === -1 ? fallback[i] : col; });

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    var rows = sheet.getLastRow() - 1;
    var changed = 0;

    cols.forEach(function (col) {
      // Si parte dalla riga 2: l'intestazione non e' un nome di giocatore, e
      // riscriverla la perderebbe se coincidesse col nome cercato.
      var range = sheet.getRange(2, col + 1, rows, 1);
      var values = range.getValues();
      var touched = false;

      for (var r = 0; r < values.length; r++) {
        if (String(values[r][0]).trim() === oldName) {
          values[r][0] = newName;
          touched = true;
          changed++;
        }
      }

      if (touched) range.setValues(values);
    });

    return changed;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Rinominando un giocatore nella Leaderboard, il nuovo nome viene propagato
 * alle partite gia' registrate. Senza, le sue partite resterebbero attaccate al
 * vecchio nome e in classifica comparirebbero due giocatori distinti.
 *
 * E' un trigger semplice: si attiva salvando lo script, non serve un nuovo
 * deployment (quello riguarda solo la Web App).
 */
function onEdit(e) {
  if (!e || !e.range) return;

  var sheet = e.range.getSheet();
  if (sheet.getName() !== LEADERBOARD_SHEET) return;

  // Solo modifiche a una cella singola: su un incolla multiplo `e.value` e
  // `e.oldValue` non esistono, quindi non c'e' un rename da propagare.
  if (e.range.getNumRows() !== 1 || e.range.getNumColumns() !== 1) return;
  if (e.range.getRow() < 2) return;

  // La colonna dei nomi si cerca per intestazione, come nel resto dello script,
  // invece di dare per scontato che sia la A.
  var headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
  var nameCol = columnIndex_(headers, NAME_HEADERS);
  if (nameCol === -1) nameCol = 0;
  if (e.range.getColumn() !== nameCol + 1) return;

  var oldName = String(e.oldValue == null ? '' : e.oldValue).trim();
  var newName = String(e.value == null ? '' : e.value).trim();
  if (!oldName || !newName || oldName === newName) return;

  // Rinominare su un nome gia' esistente fonde due giocatori in uno: a volte e'
  // proprio quello che si vuole (correggere un doppione), ma deve essere
  // visibile, non silenzioso.
  var giaEsistente = false;
  var rosa = readPlayers_();
  for (var i = 0; i < rosa.length; i++) {
    if (rosa[i].toLowerCase() === newName.toLowerCase() && rosa[i] !== newName) giaEsistente = true;
  }

  var changed = renamePlayer_(oldName, newName);

  SpreadsheetApp.getActiveSpreadsheet().toast(
    '"' + oldName + '" -> "' + newName + '": ' + changed + ' celle aggiornate nel match log.'
      + (giaEsistente ? ' ATTENZIONE: il nome esisteva gia\', le partite sono state unite.' : ''),
    'Giocatore rinominato',
    8
  );
}
