## 1. Fondamenta del tema (palette, font, sfondo)

- [x] 1.1 Definire le CSS custom properties su `:root` (`--bg-void`, `--bg-panel`, `--neon-pink`, `--neon-cyan`, `--neon-purple`, `--neon-yellow`, `--text-primary`, `--text-muted`) sostituendo i colori hardcoded esistenti
- [x] 1.2 Aggiungere il `<link>` a Google Fonts per il font display (es. Orbitron) con `font-display: swap` e fallback allo stack di sistema attuale
- [x] 1.3 Sostituire lo sfondo `body` con il gradiente scuro synthwave e il pattern "griglia" via CSS (`repeating-linear-gradient`/`background-image`), verificando che non causi overflow orizzontale

## 2. Restyling componenti esistenti

- [x] 2.1 Header (`header`, `header h1`, `#refreshBtn`): applicare palette scura, font display sul titolo, glow sul bottone refresh
- [x] 2.2 Pulsante "Nuova Partita" (`.btn-new-match`) e modale (`.modal-overlay`, `.modal`, `.modal-header`, `.modal-close`, `.modal-hint`): applicare palette e glow mantenendo la logica `hidden` invariata
- [x] 2.3 Form nuova partita (`select`, `input`, `.winner-pick`, `.btn-submit`): restyling con palette scura, focus visibile ad alto contrasto
- [x] 2.4 Podio (`.podium*`): applicare palette neon ai blocchi (1°/2°/3° posto) mantenendo leggibilità di nome/percentuale/record
- [x] 2.5 Stat card (`.stat-card`, `.stat-player`, `.stat-value`, `.stat-label`, `.stat-percentage`): restyling con palette scura e testo ad alto contrasto
- [x] 2.6 Tabella storico (`.history-table`, `th`, `td`, `.winner-badge`): restyling con palette scura, testo chiaro ad alto contrasto, badge vincitore con glow neon
- [x] 2.7 Stati loading/error/success (`.loading`, `.spinner`, `.error`, `.success`): restyling coerente con la palette scura mantenendo la distinguibilità semantica (errore vs successo)
- [x] 2.8 Rivedere la media query `max-width: 640px` esistente per adattare eventuali nuovi valori (font size, spaziature) introdotti dal restyling

## 3. Navigazione a pills (tab-switch)

- [x] 3.1 Aggiungere il markup della nav a pills (`<div role="tablist">` con due `<button role="tab">`) tra il pulsante "Nuova Partita" e le sezioni, senza modificare gli `id` esistenti (`#statsSection`, `#historySection`)
- [x] 3.2 Aggiungere gli attributi ARIA di collegamento tra pill e sezione (`aria-controls`, `aria-selected`, `role="tabpanel"`, `aria-labelledby`) e impostare "Statistiche" come tab attiva di default
- [x] 3.3 Implementare la funzione `switchTab(id)` in JS: aggiorna `aria-selected` e classe `.active` sulle pill, alterna l'attributo `hidden` sui due pannelli
- [x] 3.4 Collegare i listener `click` sulle pill a `switchTab`, includendo il supporto nativo da tastiera (Invio/Spazio via `<button>`, nessun handler custom necessario)
- [x] 3.5 Verificare che l'apertura/chiusura del modale "Nuova Partita" non alteri né dipenda dalla tab attiva
- [x] 3.6 Stile CSS delle pills: layout mobile-first a colonne uguali (flex/grid), stato attivo con glow neon, nessun overflow orizzontale da 320px in su

## 4. Verifica manuale

- [x] 4.1 Verificare contrasto testo/sfondo (DevTools contrast checker) su stat-value, celle tabella, winner-badge, pill attiva/inattiva
- [x] 4.2 Verificare assenza di scroll orizzontale e usabilità delle pills su viewport 320px, 375px, 768px
- [x] 4.3 Verificare il ciclo completo: cambio tab, apertura modale da entrambe le tab, inserimento nuova partita, refresh automatico dei dati a 10s con tab non attiva
- [x] 4.4 Verificare navigazione da tastiera (Tab + Invio/Spazio) tra le pill e aggiornamento di `aria-selected`
