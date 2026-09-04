## Context

`index.html` è un file singolo (HTML + CSS in `<style>` + JS in `<script>`), senza build step né dipendenze oltre a Google Fonts e al fetch verso l'endpoint Apps Script. I dati disponibili per ogni partita sono soltanto `{ data, giocatore1, giocatore2, vincitore }`: nessun punteggio, nessun orario, nessuna durata. Tutto ciò che questo change introduce deve essere derivabile da quei quattro campi.

Due vincoli del contesto esistente pesano sulle decisioni qui sotto:

- La pagina fa **auto-refresh ogni 10 secondi** (`setInterval` in `window.load`). Qualsiasi valore mostrato deve essere deterministico rispetto ai dati, o il podio e i grafici "ballerebbero" da soli sullo schermo.
- Le date arrivano dal foglio **con granularità di giorno** (`gg/mm/aaaa` o timestamp ISO a mezzanotte). L'ordine cronologico interno a una giornata non esiste nei dati: l'unica sequenza disponibile è l'ordine delle righe del foglio.

## Goals / Non-Goals

**Goals:**
- Sostituire il win rate con un rating Elo come criterio di classifica e come numero mostrato su podio e stat card.
- Mostrare da quanti giorni il leader attuale è in vetta, sotto il suo nome sul podio.
- Aggiungere una tab "Grafici" con tre grafici SVG leggibili anche a 320px di larghezza.
- Semplificare la tabella storico: corona sul vincitore invece di una colonna dedicata.
- Restare a file singolo, zero dipendenze nuove.

**Non-Goals:**
- Nessuna modifica al foglio Google, all'Apps Script o al formato dati (niente punteggi, niente orari).
- Nessuna libreria di grafici (Chart.js, D3): sarebbero l'unica dipendenza JS di terze parti del progetto.
- Nessuna persistenza dello storico Elo: il rating è ricalcolato da zero a ogni render, non memorizzato.
- Nessun grafico interattivo (zoom, pan, tooltip al hover con follow del cursore): i grafici sono statici e leggibili così come sono.

## Decisions

**Elo: rating iniziale 1000, K = 24, replay in ordine di riga.**
Formula standard: `atteso_A = 1 / (1 + 10^((R_B - R_A) / 400))`, aggiornamento `R_A += K * (risultato_A - atteso_A)` con risultato 1 per il vincitore e 0 per il perdente. K = 24 è un compromesso tra reattività (con poche decine di partite un K basso non separerebbe nessuno) e stabilità (un K alto farebbe oscillare la classifica a ogni partita). Il replay parte dalla prima riga del foglio e procede in ordine di inserimento: è l'unica sequenza cronologica disponibile, dato che la data ha granularità di giorno.
Alternativa scartata: mantenere il win rate come metrica secondaria accanto all'Elo — raddoppierebbe i numeri sul podio senza aggiungere informazione, dato che l'Elo già incorpora vittorie e sconfitte.

**Nessuna soglia di partite minime.**
Con il win rate serviva (un 1-0 valeva 100%); con l'Elo non serve, perché chi ha vinto una sola partita si ferma intorno a 1012 e non può scavalcare un giocatore consolidato. Un giocatore nuovo entra semplicemente a 1000 e sale o scende dalle sue partite.
Alternativa scartata: marcare come "provvisori" i rating sotto le 5 partite — informazione in più da spiegare a fronte di un problema che l'Elo non ha.

**Ordinamento della classifica con criterio totale.**
Elo decrescente, poi vittorie, poi partite giocate, poi ordine alfabetico. Serve un criterio totale (non solo l'Elo) perché con l'auto-refresh a 10 secondi due giocatori appaiati altrimenti si scambierebbero di posto a ogni tick, secondo l'ordine di iterazione dell'array. È lo stesso ragionamento già applicato all'attuale ordinamento per win rate.

**Permanenza in vetta: replay per giornata, conteggio in giorni di calendario.**
Si raggruppano le partite per giorno, si ricalcola la classifica alla fine di ogni giornata e si ottiene il leader di quel giorno. Partendo dall'ultima giornata si risale indietro finché il leader resta lo stesso; la permanenza è il numero di giorni di calendario dal giorno in cui ha preso la vetta a oggi, inclusi i giorni senza partite (chi è in vetta ci resta anche quando nessuno gioca — è il senso di "mantenere il posto") e con minimo 1 giorno.
Alternativa scartata: contare solo le giornate con partite giocate — direbbe "3 giorni" per un dominio durato tre settimane, che non è ciò che la frase promette.

**Grafici: SVG inline generati a mano, nessuna libreria.**
Tre grafici semplici (linee, barre orizzontali, barre impilate) non giustificano l'unica dipendenza di terze parti del progetto, che oltretutto andrebbe caricata da CDN — un punto di rottura in più su una pagina che già dipende da un endpoint lento. L'SVG si genera con le stesse template string già usate ovunque nel file per il resto del rendering, eredita i colori dalle CSS custom properties e scala senza sgranare.
Alternativa scartata: `<canvas>` — richiederebbe di ridisegnare a mano su resize e non eredita nulla dal CSS del tema.

**Nel grafico a linee l'identita' sta nell'etichetta, non nel colore.**
Le coppie di colori sono state verificate sulla lista *adiacente*, che e' quella giusta per le barre impilate (un segmento si confronta solo con quello che tocca) ma sbagliata per un grafico a linee: li' ogni serie si confronta con tutte le altre, perche' le linee si incrociano e corrono affiancate. Verificando le stesse tinte su *tutte* le coppie, con sei serie in campo magenta e verde acqua distano ΔE 1.6 per una deuteranopia e giallo e arancio distano 10.6 anche a vista normale, sotto la soglia di 15. Nessun insieme di otto o dieci colori categorici puo' superare quel controllo: e' un limite della forma, non della palette.
Quindi ogni linea porta il nome scritto in fondo (le posizioni in classifica sono uniche per definizione, quindi due etichette non possono sovrapporsi) piu' un tratteggio proprio, e il colore resta un aiuto, non l'unico appiglio. Alternativa scartata: limitare il grafico a tre serie, l'unico numero che supera il controllo su tutte le coppie — risponderebbe alla lettera del vincolo rendendo inutile il grafico.

**Colori per giocatore: palette categorica fissa a 10 slot, assegnata per indice.**
Il colore di un giocatore è lo slot corrispondente al suo indice nell'array `players` (già ordinato alfabeticamente) in una palette categorica di 10 tinte, il cui *ordine* è parte della garanzia: la sequenza è stata verificata contro il fondo del pannello (`#1a0b3d`) su banda di luminosità, chroma, separazione per daltonismo (ΔE peggiore 8.4 sulle coppie adiacenti), separazione a vista normale (19.3) e contrasto (tutti ≥ 3:1). I colori sono gli stessi in tutti i grafici e non cambiano tra un refresh e l'altro; cambiano solo se entra un giocatore con un nome alfabeticamente precedente, evento raro e visibile.
Gli ultimi due slot (teal e bruno) sono stati **aggiunti in coda**, non inseriti riordinando: un ordine diverso supererebbe anch'esso i controlli, ma cambierebbe il colore di ogni giocatore già in classifica, e la stabilità del colore è essa stessa un requisito.
Oltre il decimo giocatore i colori **non vengono riciclati** (due serie dello stesso colore sono peggio di nessun colore): i giocatori in eccedenza usano un grigio neutro e restano identificati dall'etichetta diretta, che ogni linea porta comunque.
Alternativa scartata: generare le tinte con l'angolo aureo (`hue = indice * 137.5`) — scala a qualsiasi numero di giocatori ma produce coppie indistinguibili per chi ha una carenza cromatica, e non è verificabile a priori.

**Larghezza misurata dal contenitore, non `viewBox` fisso.**
Ogni SVG viene generato con un `viewBox` pari alla larghezza reale del contenitore, così le etichette restano alla dimensione in pixel scelta invece di rimpicciolirsi con lo scaling (un `viewBox` fisso da 600px reso a 320px dimezzerebbe il testo). Conseguenza: finché la sezione è `hidden` la larghezza misurata è 0, quindi i grafici si disegnano quando la tab viene aperta e si ridisegnano al resize della finestra, non solo all'arrivo dei dati.

**Andamento classifica: asse Y invertito sulla posizione, non sull'Elo.**
Il grafico mostra la posizione in classifica (1 in alto) e non il valore Elo, perché la domanda a cui risponde è "chi sta salendo e chi sta scendendo": con l'Elo grezzo le linee di giocatori vicini si sovrappongono e la lettura si perde. L'asse Y è discreto (1..N) e invertito, con un punto per giornata giocata.

**Vittorie per giorno: barre impilate per vincitore.**
Ogni barra è una giornata, la sua altezza totale è il numero di partite di quel giorno e i segmenti sono i vincitori, con i colori della legenda condivisa. Legge insieme due cose: quanto si è giocato e chi ha vinto. Le giornate senza partite non compaiono come barre a zero (renderebbero il grafico quasi vuoto dopo una pausa lunga), ma l'asse resta in ordine cronologico.

**Storico: corona accanto al nome, colonna "Vincitore" rimossa.**
La quarta colonna ripete un nome già presente in una delle due precedenti. Sostituirla con `👑` accanto al nome vincente nella colonna dove già si trova libera spazio orizzontale — utile su mobile, che è il device primario — senza perdere informazione. La classe `.winner-badge` viene sostituita da uno stile sul nome del vincitore (`.winner-name`), quindi il requisito di tema sul badge va aggiornato di conseguenza.

## Risks / Trade-offs

**L'ordine di riga del foglio determina l'Elo.** Se qualcuno riordina o modifica a mano le righe del foglio, i rating cambiano (l'ordine dei match conta nell'Elo). Con i dati attuali — righe aggiunte solo in coda dal form — il rischio è teorico, ma è la ragione per cui il rating è ricalcolato e non memorizzato: qualunque correzione sul foglio si riflette immediatamente e in modo coerente.

**L'Elo è meno immediato del win rate.** "1180" dice meno di "72% win" a chi non conosce il sistema. Mitigazione: il record W-L resta visibile accanto al rating su podio e stat card, quindi il contesto c'è comunque.

**Il grafico dell'andamento diventa illeggibile con molti giocatori.** Oltre gli 8-10 giocatori le linee si accavallano. Con il gruppo attuale non è un problema; se dovesse diventarlo, la via d'uscita è limitare il grafico ai primi N in classifica.

**Il ricalcolo completo gira ogni 10 secondi.** Replay dell'Elo, standings giornaliere e rigenerazione dei tre SVG a ogni tick di auto-refresh. Con centinaia di partite e una decina di giocatori si parla di frazioni di millisecondo, quindi non si introduce alcuna cache o memoizzazione: sarebbe complessità senza un problema misurato.

## Migration Plan

Non applicabile: nessun dato persistito cambia formato e non esistono stati salvati lato client. Il change è interamente contenuto in `index.html` e ha effetto al primo reload della pagina.

## Open Questions

Nessuna.
