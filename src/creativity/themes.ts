/** One week's reading in the Creativity Workbook, the same in every cycle. */
export interface Theme {
    title: string;
    focus: string;
    questions: string[];
    exercises: string[];
    outing: string;
    tinyAction: string;
    /** Ticks are stored by position, so only append to these lists. */
    evidence: string[];
}

/** The 12 themes, week 1 first. */
export const THEMES: readonly Theme[] = [
    {
        title: 'Via la perfezione',
        focus: 'Crea qualcosa senza pensare al risultato finale né a un processo perfetto.',
        questions: [
            'Dove ho imparato che la creatività deve essere utile, impressionante o redditizia?',
            'Cosa temo possa succedere se faccio qualcosa male?',
            'Quali condizioni mi fanno sentire in gioco invece che sotto giudizio?',
        ],
        exercises: [
            'Fai un elenco dei piccoli progetti che hai nel cuore o in mente.',
            'Elenca le condizioni d’atmosfera emerse nella riflessione d’apertura, da ricreare nelle tue pratiche creative.',
        ],
        outing: 'Gira per un negozio di belle arti, visita un giardino, esplora un quartiere nuovo e dai un voto alla sua architettura.',
        tinyAction:
            'Crea in 15 minuti qualcosa di volutamente grezzo, brutto, imperfetto o disordinato: inizia uno dei tuoi piccoli progetti e fallo alla buona per 15 minuti.',
        evidence: [
            'Ho praticato senza bisogno che il risultato fosse bello.',
            'Ho lavorato 15 minuti a un progetto senza pianificare o preparare troppo.',
            'Ho reso più facile tornare nel mio spazio creativo.',
        ],
    },
    {
        title: 'Curiosità',
        focus: 'Ritrova la persona che sei quando nessuno ti dà un voto o ti giudica.',
        questions: [
            'Cosa mi affascinava prima che la produttività e il senso pratico prendessero il sopravvento?',
            'Quali identità creative ho superato?',
            'Cosa proverei se non dovessi guadagnarci o dichiararlo ad alta voce come «la mia cosa»?',
        ],
        exercises: [
            'Inventario delle curiosità: elenca 25 argomenti, texture, luoghi, abilità, suoni, ambienti o domande che attirano la tua attenzione.',
            'Le versioni passate: nomina cinque versioni precedenti di te e cosa amava ciascuna.',
            'Esplorare l’identità: completa 10 volte la frase «Sono una persona che potrebbe…».',
            'Interessi: cerchia tre curiosità che potrebbero unirsi in un unico esperimento.',
        ],
        outing: 'Visita una libreria specializzata, ascolta musica che non conosci, partecipa a una dimostrazione gratuita o fotografa un solo colore per un’ora.',
        tinyAction: 'Prova un mezzo espressivo in cui non ti riconosci.',
        evidence: [
            'Ho seguito un interesse senza pretendere un piano.',
            'Ho accettato di essere alle prime armi.',
            'Ho notato una parte di me che avevo dimenticato.',
        ],
    },
    {
        title: 'Voce',
        focus: 'Esercitati ad ascoltare ed esprimere le tue preferenze. (Puro orrore per chi vuole sempre accontentare tutti.)',
        questions: [
            'Dove ammorbidisco, nascondo o giustifico troppo i miei gusti o le mie opinioni?',
            'Cosa vorrei dire che mi sembra rischioso o poco gradito?',
            'Quale approvazione pesa troppo sulle mie scelte?',
        ],
        exercises: [
            'Lista dei gusti: fai due elenchi, «Più di questo» e «Meno di questo», con almeno 15 voci ciascuno.',
            'Senza filtri: scrivi per 20 minuti partendo da «Quello che non ho detto è…».',
            'Scegliere: prendi in fretta una piccola decisione creativa, senza chiedere il parere di nessuno.',
        ],
        outing: 'Vai a una serata open mic, fai un giro in un museo d’arte o in un negozio di moda lontano dai tuoi gusti.',
        tinyAction:
            'Esprimi ad alta voce una preferenza sincera, anche rischiosa, senza scusarti. Ce la puoi fare!',
        evidence: [
            'Ho fatto una scelta prima di cercare approvazione.',
            'Ho espresso qualcosa di preciso e vero.',
            'Ho superato un momento di disagio creativo.',
        ],
    },
    {
        title: 'Attenzione',
        focus: 'Osserva dove finiscono davvero il tuo tempo e la tua attenzione: è ora di fare un bilancio del tempo.',
        questions: [
            'Dove il mio calendario contraddice ciò che dico che conta? Ho chiaro cosa conta davvero per me?',
            'Cosa sto consumando invece di creare?',
        ],
        exercises: [
            'Revisione degli input: per tre giorni annota, senza giudicare, media, scrolling, notizie e intrattenimento. Scrivi tutto quello che consumi e non filtrare quello che fai di solito.',
            'Scegli un input che ti distrae e sospendilo per 48 ore.',
            'Calendario: individua dove la creatività può prendere il posto di qualcos’altro nel tuo calendario vero, e blocca quello spazio.',
            'Porta a termine una piccola promessa che avevi fatto a te.',
        ],
        outing: 'Fai una di queste cose senza telefono (lascialo a casa!): una passeggiata, un pomeriggio in biblioteca, guardare la gente da un bar, un film al cinema, una cena fuori con te.',
        tinyAction: 'Scambia 15 minuti di consumo con 15 minuti di creazione.',
        evidence: [
            'Ho notato uno schema nella mia attenzione.',
            'Ho sostituito un momento di consumo con un momento in cui ho creato qualcosa.',
        ],
    },
    {
        title: 'Immaginazione',
        focus: 'Allenta la presa del pensiero «realistico» quanto basta per scoprire nuove possibilità. Abbraccia l’energia bambina del «tutto è possibile!»',
        questions: [
            'Quale possibilità scarto troppo in fretta?',
            'Se tempo, status e denaro non contassero, cosa esplorerei? Fanne un elenco, e che sia lungo!',
            'Quale desiderio continua a riaffiorare?',
        ],
        exercises: [
            'Cinque vite alternative: abbozza cinque vite diverse che ti piacerebbe vivere.',
            'La giornata creativa ideale: descrivi una giornata normale e appagante, dal risveglio al sonno.',
            'Scegli un sogno ed elencane dieci versioni più piccole.',
            'Crea una copertina, un poster, un indice, un trailer o una descrizione alla buona per qualcosa che non esiste ancora.',
        ],
        outing: 'Visita la sala di un museo che di solito salti, prova un corso per un nuovo hobby.',
        tinyAction:
            'Rendi possibile questo mese un’idea da «un giorno»: mettila in calendario, così diventa reale.',
        evidence: [
            'Ho trovato una versione più piccola di una grande idea.',
            'Ho immaginato oltre la mia realtà attuale.',
        ],
    },
    {
        title: 'Risorse',
        focus: 'Scopri le risorse che hai per dare vita alle cose.',
        questions: [
            'Di cosa credo di avere bisogno prima di poter cominciare?',
            'Quali risorse, abilità o relazioni sto trascurando?',
        ],
        exercises: [
            'Elenca il tempo, gli strumenti, gli spazi, le abilità, le persone e le risorse gratuite che hai a disposizione.',
            'Definisci la versione più piccola ed economica di un esperimento creativo.',
            'Crea un’esperienza sensoriale ricca con quello che hai già. (Per esempio, una serata spa solo con quello che hai in casa.)',
        ],
        outing: 'Visita un mercatino dell’usato, prepara un picnic con quello che hai in dispensa, esplora una galleria gratuita o cerca le casette di scambio libri per lasciarne e prenderne uno.',
        tinyAction: 'Comincia prima di comprare qualcosa di nuovo.',
        evidence: [
            'Ho usato in modo creativo una risorsa che avevo già.',
            'Ho lasciato che una cosa semplice bastasse.',
        ],
    },
    {
        title: 'Comunità e influenze',
        focus: 'Scegli gli input (le fonti di media e di consumo), le relazioni e le comunità che nutrono il tuo lavoro.',
        questions: [
            'Chi allarga il mio senso del possibile?',
            'Quali ambienti o atmosfere mi prosciugano?',
            'Che tipo di comunità creativa sentirei reciproca?',
        ],
        exercises: [
            'Nomina dieci creativi che ti emozionano e individua la qualità che vuoi imparare da ciascuno.',
            'Fai pulizia nei tuoi media online (e in ogni altra fonte) ed elimina tutto e tutti quelli che non aggiungono qualcosa di positivo.',
            'Manda un messaggio di apprezzamento preciso a un creativo, un collega, un amico o una persona cara.',
        ],
        outing: 'Vai a una lettura pubblica, un piccolo concerto, una conferenza aperta o un laboratorio di quartiere.',
        tinyAction: 'Avvia un legame creativo che ti nutre. Buttati.',
        evidence: [
            'Ho cercato una comunità senza fare confronti.',
            'Ho studiato un’influenza senza copiarla.',
            'Ho tenuto lontano un input che mi prosciuga.',
        ],
    },
    {
        title: 'Slancio e obiettivi a misura',
        focus: 'Fai piccoli passi.',
        questions: [
            'Dove uso obiettivi enormi per evitare un inizio alla mia portata?',
            'Cosa si può completare in una sola seduta?',
            'Quale progetto incompiuto desidero finire?',
        ],
        exercises: [
            'Scegli un obiettivo fermo e individua la prossima azione concreta e visibile.',
            'Sprint di venti minuti: lavora a un progetto per esattamente 20 minuti, poi fermati o continua, a tua scelta. Imposta il timer.',
            'Definisci cosa significa «fatto abbastanza» per un piccolo progetto.',
            'Parti dal risultato che vuoi e ricostruisci all’indietro sette passi o tappe concrete.',
        ],
        outing: 'Prendi un mezzo pubblico verso un posto che non conosci. Guarda uno spettacolo dal vivo.',
        tinyAction: 'Finisci una piccola cosa e dalle un nome.',
        evidence: [
            'Ho scelto l’azione invece di pianificare e preparare troppo.',
            'Ho ridotto un obiettivo vago a un’azione visibile.',
            'Ho completato qualcosa della dimensione giusta.',
        ],
    },
    {
        title: 'Compassione e resilienza',
        focus: 'Rispondi in modo costruttivo a paura, invidia e delusione.',
        questions: [
            'Quale ferita creativa condiziona ancora il mio comportamento o la mia capacità di portare avanti progetti creativi?',
            'Come mi tratto di solito dopo una delusione?',
        ],
        exercises: [
            'Riprendi una delusione passando per fatti, sentimenti, lezioni e prossimi passi.',
            'Lettera a chi comincia: scrivi l’incoraggiamento di cui avevi bisogno all’inizio.',
            'Inventa un rituale di cinque minuti per ripartire dopo un periodo in cui hai evitato qualcosa.',
        ],
        outing: 'Guarda un film che ti conforta, torna a un tuo preferito dell’infanzia o elenca i conforti della tua infanzia, cucina qualcosa di nostalgico.',
        tinyAction:
            'Torna a qualcosa che hai evitato, senza recuperare il tempo perso né rimuginare su quanto l’hai evitato.',
        evidence: [
            'Ho ripreso qualcosa dopo averlo evitato.',
            'Ho trovato una routine confortante da usare quando devo ripartire con il giusto spirito.',
        ],
    },
    {
        title: 'Confini',
        focus: 'Proteggi le condizioni che permettono alla tua vita creativa di continuare.',
        questions: [
            'Cosa ruba di continuo il tempo per creare, o lo spazio per la creatività?',
            'Quali abitudini mi danno sollievo ma mi spengono?',
        ],
        exercises: [
            'Individua cinque cose ricorrenti che ti prosciugano tempo, denaro, attenzione o fiducia.',
            'Rendi più difficile un’abitudine poco utile e più facile un’abitudine creativa.',
            'Definisci cosa conta in una giornata difficile, in una normale e in una di riposo.',
        ],
        outing: 'Vai in una sauna, in un giardino, in una sala da tè o in qualsiasi posto che insegni a ricaricarsi.',
        tinyAction:
            'Di’ di no, rimanda, automatizza o elimina una cosa che ti prosciuga.',
        evidence: [
            'Ho protetto un blocco di tempo creativo.',
            'Ho ridotto gli attriti per cominciare.',
            'Almeno una volta ho scelto di ricaricarmi invece di anestetizzarmi (o almeno ho capito quali abitudini mi anestetizzano).',
        ],
    },
    {
        title: 'Autonomia',
        focus: 'Costruisci una pratica adatta alla tua vera natura. (Questo workbook ne è un esempio.)',
        questions: [
            'Quando e come faccio naturalmente il mio lavoro migliore?',
            'Cosa significa per me il successo creativo?',
        ],
        exercises: [
            'Scrivi le istruzioni per prenderti cura del tuo io creativo: energia, ambiente, ritmo, feedback, riposo e così via.',
            'Scegli le tre misure che contano di più.',
            'Inventa un semplice rituale di apertura e di chiusura per le sessioni creative.',
        ],
        outing: 'Organizza un mini ritiro in solitudine, progetta lo spazio di lavoro ideale con quello che hai (riorganizza, sposta i mobili) o visita un posto che ti somiglia senza dubbio.',
        tinyAction:
            'Adatta una parte della tua pratica perché ti calzi meglio.',
        evidence: ['Ho definito il successo con parole mie.'],
    },
    {
        title: 'Evviva!',
        focus: 'Integra ciò che ha funzionato e progetta il prossimo ciclo.',
        questions: [
            'Cosa ha funzionato e cosa no?',
            'Cosa voglio continuare senza che diventi un altro obbligo?',
        ],
        exercises: [
            'Raccogli oggetti, appunti, foto, ritagli ed esperimenti completati nelle 12 settimane.',
            'Segna dieci esperienze significative del ciclo. Qualche vittoria?',
            'Scegli una pratica da mantenere.',
            'Scrivi una breve lettera, da conservare, alla persona che eri all’inizio della settimana 1.',
        ],
        outing: 'Allestisci una mostra privata, concediti un pasto per festeggiare, torna alla tua uscita preferita o segna la fine con un piccolo rituale e raccogli in un album tutto quello che hai fatto.',
        tinyAction: 'Scegli la data del tuo prossimo ciclo creativo.',
        evidence: [
            'Ho celebrato il percorso.',
            'Ho individuato cosa voglio continuare.',
        ],
    },
];
