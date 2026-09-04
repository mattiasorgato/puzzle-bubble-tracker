## Purpose

Definisce le transizioni animate di mostra/nascondi usate nell'interfaccia: il cambio di sezione al click sulle pill di navigazione e l'apertura/chiusura del modale "Nuova Partita", incluso il rispetto della preferenza di sistema `prefers-reduced-motion`.

## Requirements

### Requirement: Animated tab panel switch
Il sistema SHALL animare il passaggio da una sezione all'altra quando l'utente clicca una pill di navigazione: la sezione attualmente visibile SHALL eseguire una breve animazione di uscita prima di essere nascosta, e la sezione selezionata SHALL eseguire una breve animazione di ingresso quando diventa visibile.

#### Scenario: Uscita della sezione corrente al click su un'altra pill
- **WHEN** l'utente clicca la pill "📝 Storico" mentre "📊 Statistiche" è visibile
- **THEN** la sezione "Statistiche" esegue un'animazione di uscita (es. dissolvenza) prima di ricevere l'attributo `hidden`

#### Scenario: Ingresso della sezione selezionata
- **WHEN** la sezione "Storico" diventa visibile (perde l'attributo `hidden`) in seguito al click sulla pill corrispondente
- **THEN** la sezione esegue un'animazione di ingresso (es. dissolvenza/leggero spostamento) invece di comparire istantaneamente

### Requirement: Animated modal open and close
Il sistema SHALL animare l'apertura del modale "Nuova Partita" con un effetto di comparsa, e la sua chiusura con un effetto simmetrico di scomparsa, indipendentemente dal trigger di chiusura usato (pulsante ✕, click sullo sfondo, tasto Esc).

#### Scenario: Apertura del modale
- **WHEN** l'utente clicca "➕ Nuova Partita"
- **THEN** il modale compare con un'animazione (es. dissolvenza con leggero effetto di scala) invece di apparire istantaneamente

#### Scenario: Chiusura del modale da qualsiasi trigger
- **WHEN** l'utente chiude il modale tramite il pulsante ✕, un click sullo sfondo, o il tasto Esc
- **THEN** il modale esegue un'animazione di chiusura e viene effettivamente rimosso dalla vista (attributo `hidden` impostato) solo al termine dell'animazione, in tutti e tre i casi

### Requirement: Reduced motion respected
Il sistema SHALL rispettare la preferenza di sistema `prefers-reduced-motion: reduce`: quando attiva, il cambio di tab e l'apertura/chiusura del modale SHALL avvenire istantaneamente, senza alcuna animazione né alcun ritardo introdotto dalla logica di attesa fine-animazione.

#### Scenario: Cambio tab con motion ridotta
- **WHEN** l'utente ha `prefers-reduced-motion: reduce` attivo e clicca una pill
- **THEN** la sezione precedente viene nascosta e quella nuova mostrata immediatamente, senza animazione né ritardo percepibile rispetto al click

#### Scenario: Modale con motion ridotta
- **WHEN** l'utente ha `prefers-reduced-motion: reduce` attivo e apre o chiude il modale
- **THEN** il modale appare o scompare immediatamente, senza animazione né ritardo percepibile rispetto all'azione

### Requirement: Accessibility state unaffected by animation timing
Il sistema SHALL aggiornare `aria-selected` sulle pill e lo stato attivo (classe `.active`) in modo sincrono al click, indipendentemente dalla durata dell'animazione di uscita/ingresso della sezione corrispondente.

#### Scenario: aria-selected aggiornato subito al click
- **WHEN** l'utente clicca una pill non ancora attiva
- **THEN** l'attributo `aria-selected` e la classe `.active` sulle pill si aggiornano immediatamente al click, anche se l'animazione della sezione è ancora in corso
