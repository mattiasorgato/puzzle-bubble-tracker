## Why

La pagina attuale usa uno stile "corporate SaaS" generico (gradiente viola, card bianche, ombre morbide) che non riflette il tema del prodotto (Puzzle Bubble, un gioco arcade). L'utente vuole una skin a tema anni 80/synthwave e, contestualmente, una navigazione più solida: oggi le sezioni "Statistiche" e "Storico Partite" sono semplicemente impilate una sotto l'altra, il che allunga lo scroll su mobile (il device d'uso primario).

## What Changes

- Applicare una skin **synthwave/Miami anni 80** a tutta la pagina: sfondo scuro con gradiente notturno, palette neon (magenta/ciano/viola), glow sui bordi di header/card/bottoni, font display squadrato per titoli e heading, dettaglio "griglia prospettica" opzionale in header o sfondo.
- Restyling di tutti i componenti esistenti con la nuova palette: header, pulsante "Nuova Partita", modale, podio, stat card, tabella storico, badge vincitore, stati di loading/errore/successo — mantenendo leggibilità e contrasto (WCAG AA) su sfondo scuro.
- Sostituire la disposizione impilata di "Statistiche" e "Storico Partite" con una **navigazione a pills** (due pill: "📊 Statistiche" / "📝 Storico") che agisce come tab-switch: una sola sezione visibile alla volta, click sulla pill corrispondente per cambiare vista. Il pulsante "➕ Nuova Partita" resta un'azione separata in cima alla pagina, non una tab.
- Mantenere l'impostazione **mobile-first**: le pills devono restare usabili a piena larghezza anche su schermi stretti (≥320px), senza introdurre scroll orizzontale.
- Nessuna modifica alla logica dati (fetch da Google Apps Script, calcolo statistiche, salvataggio partita): il cambiamento è solo visivo e di navigazione.

## Capabilities

### New Capabilities
- `ui-theme`: definisce la skin visiva anni 80/synthwave applicata a tutti i componenti della pagina (palette colori, tipografia, effetti glow/ombre, stati loading/error/success, responsive mobile-first).
- `tabbed-navigation`: definisce il menu di navigazione a pills che governa la visibilità delle sezioni Statistiche/Storico tramite tab-switch, mantenendo lo stato accessibile (focus, tastiera, ARIA) e mobile-first.

### Modified Capabilities
_Nessuna: non esistono spec preesistenti in `openspec/specs/`, quindi non ci sono capacità modificate._

## Impact

- File coinvolto: [index.html](index.html) (unico file del progetto: HTML, CSS in `<style>`, JS in `<script>` inline).
- Nessun impatto su API, backend (Google Apps Script) o formato dati: le funzioni `updateStats`, `updatePodium`, `updateHistory`, `loadData`, il submit del form restano invariate nella logica.
- Impatto CSS: sostituzione quasi totale delle regole di stile esistenti (variabili colore, gradienti, ombre) mantenendo le stesse classi/selettori dove possibile per non toccare il JS.
- Impatto HTML/JS: aggiunta del markup per le pills di navigazione e della logica minima di tab-switch (mostra/nascondi sezione attiva, gestione classe "active"); nessuna modifica alle chiamate di rete o alla struttura dati.
