/**
 * The Recap and Prepare questions, the same every month. Answers are stored
 * under these keys, so a key never changes once shipped; the wording can.
 *
 * A question with one key is a free-text field. One with several keys is a
 * numbered list of one-line fields.
 */

export interface Question {
    text: string;
    keys: string[];
}

export interface Section {
    title?: string;
    questions: Question[];
}

export const RECAP: Section[] = [
    {
        title: 'Successi e traguardi',
        questions: [
            {
                text: 'Cosa ho realizzato questo mese di cui sono fiero/a?',
                keys: ['recap.wins.proud'],
            },
            {
                text: 'Verso quali obiettivi ho fatto dei passi avanti?',
                keys: ['recap.wins.progress'],
            },
            {
                text: 'Quali obiettivi ho raggiunto o superato?',
                keys: ['recap.wins.reached'],
            },
        ],
    },
    {
        title: 'Lezioni imparate',
        questions: [
            {
                text: 'Cosa ha funzionato bene per me questo mese?',
                keys: ['recap.lessons.worked'],
            },
            {
                text: 'Cosa non ha funzionato o mi ha tolto energia?',
                keys: ['recap.lessons.drained'],
            },
            {
                text: 'Cosa posso fare diversamente la prossima volta?',
                keys: ['recap.lessons.change'],
            },
        ],
    },
    {
        title: 'Check-in personale',
        questions: [
            {
                text: 'Umore, energia e stato mentale di questo mese',
                keys: ['recap.checkin.mood'],
            },
            {
                text: 'Salute fisica e benessere',
                keys: ['recap.checkin.health'],
            },
            {
                text: 'Relazioni e legami',
                keys: ['recap.checkin.relationships'],
            },
            {
                text: 'Creatività e ispirazione',
                keys: ['recap.checkin.creativity'],
            },
        ],
    },
];

export const PREPARE: Section[] = [
    {
        questions: [
            {
                text: 'Citazione, mantra o affermazione che mi guidi nel nuovo mese',
                keys: ['prepare.quote'],
            },
            {
                text: 'Descrivi in tre parole come vorresti che questo mese sia per te',
                keys: [1, 2, 3].map((n) => `prepare.words${n}`),
            },
        ],
    },
    {
        title: "Visione d'insieme (obiettivi grandi)",
        questions: [
            {
                text: 'A quali obiettivi grandi voglio avvicinarmi questo mese?',
                keys: ['prepare.major.goals'],
            },
            {
                text: 'Quali traguardi intermedi raggiungerò lungo la strada?',
                keys: ['prepare.major.milestones'],
            },
            {
                text: 'Scomponi il primo traguardo in azioni concrete',
                keys: [1, 2, 3, 4, 5].map((n) => `prepare.major.action${n}`),
            },
            {
                text: 'Come inserirò queste azioni nel mio mese?',
                keys: ['prepare.major.integrate'],
            },
        ],
    },
    {
        title: 'Risultati mirati (obiettivi piccoli)',
        questions: [
            {
                text: 'Quali obiettivi piccoli, specifici e misurabili voglio completare questo mese?',
                keys: ['prepare.mini.goals'],
            },
            {
                text: 'Ci sono azioni che posso fissare in calendario per il mese?',
                keys: ['prepare.mini.calendar'],
            },
        ],
    },
    {
        title: 'Il mese che voglio vivere',
        questions: [
            {
                text: 'Elenca tre cose che vorresti accadessero questo mese',
                keys: [1, 2, 3].map((n) => `prepare.life.wish${n}`),
            },
            {
                text: 'Una buona abitudine che vorresti continuare a fare questo mese',
                keys: ['prepare.life.habit'],
            },
            {
                text: 'Le persone che vorresti rivedere questo mese o ritagliare di più del tempo per stare insieme',
                keys: ['prepare.life.people'],
            },
            {
                text: 'Qualcosa di cui sei grato/a già adesso e che sai illumina le tue giornate più dure',
                keys: ['prepare.life.grateful'],
            },
            {
                text: 'Una cosa che farai ogni settimana questo mese solo per te stesso/a, la tua gioia e il tuo piacere senza alcun fine particolare',
                keys: ['prepare.life.weekly'],
            },
            {
                text: 'Una o due pietanze che vorresti provare a cucinare questo mese',
                keys: [1, 2].map((n) => `prepare.life.dish${n}`),
            },
        ],
    },
];

export const ANSWER_KEYS = new Set(
    [...RECAP, ...PREPARE].flatMap((section) =>
        section.questions.flatMap((question) => question.keys)
    )
);
