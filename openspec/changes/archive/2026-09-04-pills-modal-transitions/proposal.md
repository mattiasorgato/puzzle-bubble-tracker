## Why

Dopo il redesign synthwave e l'introduzione della nav a pills, i cambi di stato dell'interfaccia (switch tra "Statistiche"/"Storico", apertura/chiusura del modale "Nuova Partita") restano istantanei: la sezione cambia e il modale appare/scompare senza transizione. Una piccola animazione di show/hide renderebbe l'interazione più fluida e coerente con l'estetica "arcade" appena applicata.

## What Changes

- Cambio tab a pills: cliccando su una pill, la sezione attualmente visibile sfuma via ("hide") e la sezione selezionata sfuma/scivola in vista ("show"), invece dello scatto immediato attuale.
- Modale "Nuova Partita": apertura con una breve animazione "pop-in" (fade + leggero overshoot in stile arcade); chiusura con un'animazione simmetrica di fade-out/scale-down, applicata a tutti i modi in cui il modale si chiude oggi (pulsante ✕, click sullo sfondo, tasto Esc).
- Le animazioni SHALL rispettare `prefers-reduced-motion`: chi ha disabilitato le animazioni di sistema continuerà a vedere show/hide istantanei come oggi, senza alcun ritardo introdotto dalla nuova logica di attesa fine-animazione.
- Nessuna modifica al comportamento funzionale già specificato: resta vero che una sola sezione è visibile per volta, gli attributi ARIA (`aria-selected`, `hidden`) restano gli stessi e si aggiornano comunque immediatamente al click (solo la resa visiva della sezione è ritardata dall'animazione, non lo stato logico/di accessibilità), il modale si apre/chiude con gli stessi trigger di oggi.

## Capabilities

### New Capabilities
- `ui-motion`: animazioni di show/hide per il cambio di tab a pills e per l'apertura/chiusura del modale nuova partita, con supporto a `prefers-reduced-motion`.

### Modified Capabilities
_Nessuna: il comportamento già coperto da `tabbed-navigation` (visibilità, ARIA, stato attivo) non cambia — questa change aggiunge solo un livello di presentazione (transizione visiva) sopra un comportamento già specificato e invariato._

## Impact

- File coinvolto: [index.html](index.html) (unico file del progetto).
- CSS: nuove `@keyframes` per fade/slide dei pannelli tab e per pop-in/fade-out del modale, racchiuse in `@media (prefers-reduced-motion: no-preference)` cosi' che di default (motion ridotta richiesta) l'interfaccia resti istantanea come oggi.
- JS: `switchTab()` guadagna una sequenza uscita-poi-entrata (la sezione uscente anima prima di ricevere `hidden`, poi la sezione entrante diventa visibile); `closeModal()` guadagna un'analoga attesa dell'animazione di uscita prima di impostare `hidden` sull'overlay. Entrambe le sequenze vanno bypassate quando `prefers-reduced-motion: reduce` e' attivo, per non introdurre ritardi percepibili quando le animazioni sono disattivate.
- Nessun impatto su fetch/dati, su `openFormBtn`/tasti Esc/click-sfondo come trigger, o sulla struttura ARIA già definita in `tabbed-navigation`.
