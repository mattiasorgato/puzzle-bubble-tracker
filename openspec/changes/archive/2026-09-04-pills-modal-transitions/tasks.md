## 1. Fondamenta animazioni

- [x] 1.1 Aggiungere le `@keyframes` per il tab panel (fade-out/uscita e fade-in con leggero translateY/entrata) dentro `@media (prefers-reduced-motion: no-preference)`
- [x] 1.2 Aggiungere le `@keyframes` per il modale (pop-in con leggero overshoot in apertura, fade-out/scale-down in chiusura) dentro la stessa media query
- [x] 1.3 Aggiungere la funzione helper JS `prefersReducedMotion()` (wrapper su `matchMedia('(prefers-reduced-motion: reduce)')`) riusabile da tab-switch e modale

## 2. Animazione cambio tab

- [x] 2.1 Aggiornare `switchTab()`: la sezione uscente riceve una classe di animazione di uscita; al termine (`animationend`, con `{ once: true }`) riceve `hidden` e perde la classe
- [x] 2.2 Dopo che la sezione uscente ha ricevuto `hidden`, rimuovere `hidden` dalla sezione entrante (l'animazione di ingresso riparte automaticamente via CSS)
- [x] 2.3 Aggiornare `aria-selected` e la classe `.active` sulle pill in modo sincrono al click, prima/indipendentemente dall'attesa dell'animazione
- [x] 2.4 Bypassare l'attesa dell'animazione quando `prefersReducedMotion()` è vero: impostare `hidden` immediatamente su entrambe le sezioni come oggi
- [x] 2.5 Gestire il click ripetuto sulla pill già attiva (nessuna animazione/nessun cambiamento) e i click rapidi tra pill diverse durante un'animazione di uscita in corso, senza lasciare entrambe le sezioni visibili o nessuna visibile

## 3. Animazione modale

- [x] 3.1 Verificare che `openModal()` non richieda modifiche: l'animazione di apertura riparte automaticamente alla rimozione di `hidden` grazie alle `@keyframes` del punto 1.2
- [x] 3.2 Aggiornare `closeModal()`: aggiungere una classe di chiusura sull'overlay, attendere `animationend` (`{ once: true }`), poi impostare `hidden = true`, rimuovere la classe ed eseguire la pulizia esistente (`matchForm.reset()`, `updateSubmitState()`)
- [x] 3.3 Bypassare l'attesa dell'animazione quando `prefersReducedMotion()` è vero: chiudere il modale immediatamente come oggi
- [x] 3.4 Verificare che i tre trigger di chiusura esistenti (✕, click sullo sfondo, tasto Esc) passino tutti per la stessa `closeModal()` aggiornata, senza percorsi che bypassano l'animazione

## 4. Verifica manuale

- [x] 4.1 Verificare visivamente il cambio tab (uscita poi entrata) e l'apertura/chiusura del modale da tutti e tre i trigger, incluso click ripetuto/rapido sulle pill
- [x] 4.2 Emulare `prefers-reduced-motion: reduce` in DevTools e verificare che tab-switch e modale restino istantanei, senza ritardo percepibile né elementi bloccati a metà transizione
- [x] 4.3 Rieseguire i controlli funzionali già coperti da [[synthwave-skin-pills-nav]] (nessun overflow orizzontale, `aria-selected` corretto, indipendenza modale/tab attiva) per escludere regressioni
- [x] 4.4 Verificare l'assenza di errori console durante animazioni ripetute (click multipli veloci su pills e apri/chiudi modale in sequenza)
