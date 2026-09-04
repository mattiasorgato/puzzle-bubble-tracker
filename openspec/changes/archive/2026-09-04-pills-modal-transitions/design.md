## Context

Il tab-switch (`switchTab()`) e il modale (`openModal()`/`closeModal()`) usano entrambi l'attributo `hidden` per mostrare/nascondere elementi (vedi [[synthwave-skin-pills-nav]], già archiviata, che ha introdotto questo pattern per la nav a pills riusando la stessa tecnica già in uso per il modale). `hidden` forza `display: none`, che non è animabile: un elemento passa da "non renderizzato" a "renderizzato" (o viceversa) in un singolo frame, senza stati intermedi da transizionare. Restiamo nello stesso file singolo `index.html` senza build step.

## Goals / Non-Goals

**Goals:**
- Show/hide animato per il cambio di sezione via pills (uscita della sezione corrente, poi ingresso di quella selezionata).
- Apertura/chiusura animata del modale "Nuova Partita", su tutti i trigger di chiusura esistenti (✕, click sfondo, Esc).
- Nessuna regressione sul comportamento già specificato in `tabbed-navigation` (una sola sezione visibile, ARIA aggiornato al click, indipendenza dal modale) né sul contratto d'uso del modale.
- Rispetto di `prefers-reduced-motion: reduce`: nessun ritardo percepibile, comportamento identico a oggi (istantaneo).

**Non-Goals:**
- Nessuna libreria di animazione esterna (Motion, GSAP, ecc.) — solo CSS `@keyframes` e classi JS, coerente con l'assenza di dipendenze del progetto.
- Nessun crossfade con sovrapposizione delle due sezioni: l'obiettivo è una transizione percepita come fluida, non un effetto complesso; l'overlap introdurrebbe un salto di altezza pagina (vedi Rischi) non giustificato dalla richiesta.
- Nessuna animazione su altri elementi (stat card, podio, tabella): la richiesta riguarda solo pills e modale.

## Decisions

**Sequenza uscita-poi-entrata (non crossfade sovrapposto) per il cambio tab.**
Al click su una pill: la sezione visibile riceve una classe che avvia un'animazione di fade-out (~130ms), al termine (`animationend`) le viene impostato `hidden`; solo a quel punto la sezione selezionata perde `hidden` e la sua animazione di fade-in/slide-in (~180ms) riparte automaticamente (vedi decisione successiva). Alternativa scartata: animare entrambe le sezioni in parallelo (crossfade) — per una frazione di secondo entrambe sarebbero visibili e occuperebbero spazio nel flusso normale (`section` è un blocco), causando un salto di altezza della pagina; evitarlo con `position: absolute` avrebbe aggiunto complessità (calcolo altezza, layout out-of-flow) sproporzionata alla richiesta.

**Le animazioni di "entrata" sfruttano il replay automatico dei `@keyframes` alla rimozione di `hidden`, senza bisogno di JS dedicato.**
Un elemento con una proprietà `animation` dichiarata in CSS la riesegue automaticamente ogni volta che passa da `display: none` a un display renderizzato (rimozione di `hidden`) — comportamento nativo del browser, non un trucco fragile. Si applica sia al pannello tab entrante sia al modale in apertura: basta che `switchTab()`/`openModal()` continuino a limitarsi a togliere `hidden`, senza dover orchestrare l'animazione di ingresso via JS. Alternativa scartata: `transition` CSS con toggle di classe — richiede impostare lo stato iniziale, forzare un reflow (doppio `requestAnimationFrame`) e poi applicare lo stato finale per far scattare la transizione dopo un `display` change; più codice e più fragile del replay nativo dei `@keyframes`.

**Le animazioni di "uscita" richiedono orchestrazione JS via `animationend`, perché rimuovere `hidden` è l'operazione che nasconde l'elemento.**
Per il modale: `closeModal()` aggiunge una classe (es. `closing`) che avvia fade-out/scale-down sull'overlay; alla fine dell'animazione (`animationend`) si imposta `hidden = true`, si rimuove la classe e si esegue la pulizia già esistente (`matchForm.reset()`, `updateSubmitState()`). Stessa idea per la sezione uscente nel tab-switch. Alternativa scartata: `setTimeout` con durata hardcoded pari alla durata dell'animazione — funziona ma disallinea silenziosamente se la durata CSS cambia in futuro; `animationend` resta sincronizzato per costruzione.

**`prefers-reduced-motion: reduce` disattiva sia le animazioni CSS sia l'attesa JS, non solo le prime.**
Le regole `@keyframes`/`animation` vengono dichiarate dentro `@media (prefers-reduced-motion: no-preference)`, quindi con motion ridotta nessuna animazione parte. Ma se il JS restasse comunque in attesa di un evento `animationend` che non arriverà mai (nessuna animazione in corso), l'elemento non verrebbe mai nascosto: `closeModal()` e la fase di uscita di `switchTab()` controllano `matchMedia('(prefers-reduced-motion: reduce)').matches` e, se vero, impostano `hidden` immediatamente, bypassando l'attesa dell'evento. Alternativa scartata: affidarsi a un timeout di sicurezza generico anche in modalità ridotta — funzionerebbe ma introdurrebbe comunque un ritardo percepibile (per quanto piccolo) che l'utente ha esplicitamente chiesto di evitare disattivando le animazioni di sistema.

**Aggiornamento di stato ARIA/classe attiva immediato, indipendente dalla durata dell'animazione.**
`aria-selected` e la classe `.active` sulle pill si aggiornano sincronamente al click, come già oggi — solo la resa visiva del pannello segue con un breve ritardo dovuto all'animazione di uscita. Questo evita che uno screen reader o un utente da tastiera veda uno stato "in sospeso" più lungo del necessario, ed è coerente con il requisito già esistente in `tabbed-navigation` (aggiornamento di `aria-selected` al cambio tab).

## Risks / Trade-offs

- [Rischio: la sequenza uscita-poi-entrata allunga leggermente il tempo percepito di cambio tab rispetto a uno scatto istantaneo] → Mitigazione: durate brevi (uscita ~130ms, entrata ~180ms, totale <320ms), ben sotto la soglia (~400ms) oltre la quale un'interazione inizia a sembrare lenta.
- [Rischio: se l'utente clicca ripetutamente e velocemente sulle pills durante un'animazione di uscita in corso, potrebbero accavallarsi listener `animationend` multipli] → Mitigazione: la funzione di gestione uscita rimuove il proprio listener dopo il primo trigger (`{ once: true }`) e ignora click ripetuti sulla stessa pill già attiva (comportamento già presente: click su pill già attiva non fa nulla di visibilmente diverso, ma va verificato che non riavvii un'animazione già in corso in modo scorretto).
- [Rischio: dimenticare il bypass per `prefers-reduced-motion` in uno dei due punti (modale o tab) lascerebbe quell'elemento bloccato in stato "in attesa" per chi ha la preferenza attiva] → Mitigazione: entrambi i punti condividono la stessa funzione helper di utilità per il check, evitando divergenza tra le due implementazioni.
- [Rischio: animare `height`/`margin` causerebbe reflow costoso su mobile] → Mitigazione: le animazioni usano solo `opacity` e `transform` (translateY, scale), proprietà accelerate via compositor, nessuna proprietà di layout animata.

## Migration Plan

Modifica diretta di `index.html`, nessun dato da migrare. Passi:
1. Aggiungere le `@keyframes` (fade-in/out pannelli, pop-in/fade-out modale) dentro `@media (prefers-reduced-motion: no-preference)`.
2. Introdurre la funzione helper `prefersReducedMotion()` (wrapper su `matchMedia`) riusata da entrambi i punti.
3. Aggiornare `switchTab()` per la sequenza uscita-poi-entrata con bypass su motion ridotta.
4. Aggiornare `closeModal()` per l'attesa dell'animazione di uscita con lo stesso bypass; nessuna modifica a `openModal()` (l'entrata è automatica via CSS).
5. Verifica manuale: cambio tab ripetuto/rapido, apertura/chiusura modale da tutti e tre i trigger, comportamento con `prefers-reduced-motion: reduce` emulato via DevTools, nessuna regressione ai controlli già effettuati in [[synthwave-skin-pills-nav]] (overflow, ARIA, ciclo funzionale).

Rollback: singolo file versionato in git, `git revert` del commit ripristina lo stato precedente.

## Open Questions

Nessuna domanda bloccante: la scelta di animare anche la chiusura del modale (oltre alla sola apertura menzionata dall'utente) è stata presa come estensione naturale e a basso rischio per coerenza visiva; l'utente può chiedere di rimuoverla in revisione se preferisce solo l'apertura animata.
