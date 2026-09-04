## Context

`index.html` è un file singolo (HTML + CSS in `<style>` + JS in `<script>`) senza build step, bundler o dipendenze esterne oltre al fetch verso un endpoint Google Apps Script. La skin attuale è un tema "corporate" viola/bianco senza tema specifico. La navigazione oggi è assente: le due sezioni (`#statsSection`, `#historySection`) sono semplicemente impilate nel DOM. L'obiettivo è restare in questo stesso formato a file singolo, senza introdurre framework, bundler o asset esterni oltre eventuali font da Google Fonts.

## Goals / Non-Goals

**Goals:**
- Ridisegnare la palette e i componenti visivi in chiave synthwave/Miami anni 80, mantenendo contrasto testo/sfondo conforme a WCAG AA.
- Introdurre una nav a pills (`role="tablist"`) che sostituisce lo stacking verticale con un tab-switch (`role="tabpanel"`, una sezione visibile alla volta).
- Restare mobile-first: le pills devono restare leggibili e senza overflow orizzontale da 320px in su.
- Non toccare la logica dati esistente (`loadData`, `updateStats`, `updatePodium`, `updateHistory`, submit del form).

**Non-Goals:**
- Nessun redesign dell'architettura dati o dell'endpoint Apps Script.
- Nessuna introduzione di build tool, framework JS o CSS (Tailwind, ecc.) — resta CSS puro in `<style>`.
- Nessuna animazione complessa (parallax, canvas): solo transizioni CSS leggere (glow, transform su hover/focus) compatibili con dispositivi mobili di fascia media.
- Il pulsante "➕ Nuova Partita" e il modale non diventano una terza tab (deciso in fase di proposta).

## Decisions

**Palette come CSS custom properties su `:root`.**
Invece di colori hardcoded sparsi (come nell'attuale `#667eea`), definire variabili (`--bg-void`, `--bg-panel`, `--neon-pink`, `--neon-cyan`, `--neon-purple`, `--neon-yellow`, `--text-primary`, `--text-muted`) usate ovunque. Alternativa scartata: mantenere colori inline come oggi — reso il refactor più fragile e meno consistente tra componente e componente.

**Sfondo: gradiente scuro + griglia CSS, nessuna immagine.**
Sfondo `body` con gradiente lineare/radiale scuro (blu notte → viola scuro → nero) e un pattern "griglia prospettica" ottenuto con `repeating-linear-gradient` o `background-image` CSS (nessun asset PNG/SVG esterno), per restare in un unico file HTML senza dipendenze binarie. Alternativa scartata: SVG di sfondo come data-URI — più pesante da mantenere leggibile nel sorgente rispetto a un gradiente CSS puro.

**Tipografia: font display via Google Fonts per titoli/pills, stack di sistema per corpo/tabella.**
Un font squadrato/geometrico (es. `Orbitron`) per `header h1`, heading di sezione e testo delle pills, caricato con `<link>` a Google Fonts (già accettabile: la pagina fa già fetch di rete verso Apps Script, quindi non introduce un nuovo vincolo "offline-first"). Il corpo testo, la tabella storico e i valori numerici restano su uno stack di sistema (leggibilità a dimensioni piccole, niente regressioni di contrasto). Alternativa scartata: un unico font display ovunque — comprometterebbe la leggibilità della tabella storico su schermi piccoli.

**Contrasto: neon riservato ad accenti/testo grande, corpo testo su grigio chiaro.**
Il testo diffuso (etichette stat, celle tabella, hint) usa `--text-primary`/`--text-muted` (grigio chiaro quasi bianco), non colori neon saturi. I colori neon (`--neon-pink`, `--neon-cyan`, ecc.) si usano per bordi, glow (`box-shadow`/`text-shadow`), titoli grandi e badge — dove un contrasto leggermente meno preciso è tollerabile e verificabile a vista. Alternativa scartata: testo neon ovunque (più "fedele" al genere ma rischia contrasto AA fallito su testo piccolo).

**Nav a pills come `role="tablist"` con tab-switch via attributo `hidden`.**
Riutilizza lo stesso pattern già presente per il modale (`hidden` + CSS `[hidden]{display:none}`), quindi nessuna nuova dipendenza. Le due pill (`button role="tab" aria-selected aria-controls`) attivano/disattivano le sezioni (`role="tabpanel"`) tramite un'unica funzione `switchTab(id)` che aggiorna `aria-selected`, la classe `.active` sulla pill e l'attributo `hidden` sui pannelli. Stato di default: "Statistiche" attiva al load. Alternativa scartata: mostrare/nascondere con `display:none` diretto senza ARIA — perde l'accessibilità da tastiera/screen reader che il resto della pagina già cura (vedi gestione `Escape` sul modale).

**Nessuno stato persistito tra i reload.**
La tab attiva torna sempre a "Statistiche" al refresh della pagina (nessun uso di `localStorage`/hash URL). Alternativa scartata: persistere in `localStorage` — complessità non richiesta dalla proposta e fuori scope per un cambiamento dichiaratamente solo visivo/di navigazione.

## Risks / Trade-offs

- [Rischio: colori neon saturi su sfondo scuro possono scendere sotto contrasto AA per testo piccolo] → Mitigazione: testo diffuso sempre in `--text-primary`/`--text-muted` chiaro; neon solo su titoli grandi, bordi, glow; verifica manuale con DevTools (contrast checker) sui componenti chiave (stat-value, winner-badge, pill attiva) prima di chiudere l'implementazione.
- [Rischio: font Google esterno introduce una dipendenza di rete e un possibile flash di testo non stilizzato (FOUT)] → Mitigazione: `font-display: swap` e stack di fallback di sistema identico a quello già usato oggi, così in assenza di rete la pagina resta comunque leggibile.
- [Rischio: nascondere un pannello con `hidden` rimuove il suo contenuto da ricerca-in-pagina/stampa] → Mitigazione: accettato, esplicitamente fuori scope (comportamento a tab richiesto dalla proposta); nessuna funzionalità di stampa/ricerca dedicata esiste oggi.
- [Rischio: refactor CSS esteso può introdurre regressioni visive sugli stati responsive già presenti (media query `max-width: 640px`)] → Mitigazione: mantenere gli stessi breakpoint/selettori esistenti dove possibile, verificare manualmente su viewport 320px, 375px, 768px dopo l'implementazione.

## Migration Plan

Modifica diretta di `index.html` (nessuno storico dati, nessun deploy separato: è una pagina statica). Passi:
1. Introdurre le CSS custom properties e il nuovo sfondo/tipografia, senza ancora toccare markup di navigazione.
2. Ridisegnare componente per componente (header, bottoni, modale, podio, stat card, tabella, badge, stati loading/error/success) riusando le classi esistenti.
3. Aggiungere il markup delle pills e la funzione `switchTab`, avvolgendo le due sezioni esistenti in pannelli tab senza cambiarne l'id (`#statsSection`, `#historySection`) per non impattare il JS che le popola.
4. Verifica manuale: viewport mobile (320–414px) e desktop, refresh dati (polling 10s) con tab non attiva, invio nuova partita, contrasto colori.

Rollback: singolo file versionato in git, un `git revert` del commit ripristina lo stato precedente senza altri effetti collaterali.

## Open Questions

Nessuna domanda bloccante aperta: le decisioni di stile (synthwave/Miami) e di comportamento nav (tab-switch, due pill) sono già state confermate dall'utente in fase di proposta.
