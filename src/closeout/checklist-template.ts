/**
 * The checklist a first month starts with. Later months copy the newest one
 * instead.
 */

const AREAS: Record<string, string[]> = {
    Finanze: [
        'Riconciliare gli estratti conto',
        'Registrare entrate e saldi dei conti',
        'Confrontare budget e spese reali',
        'Pagare le bollette in sospeso',
        'Fare pulizia degli abbonamenti',
    ],
    Organizzazione: [
        'Rivedere la lista delle attività e aggiornare le priorità',
        'Fissare in calendario le priorità alte',
        'Eliminare le attività non necessarie',
        'Riordinare i file digitali',
        'Smistare e archiviare la posta',
        'Rivedere e riordinare il brain dump',
        "Rivedere l'ispirazione salvata (pianificare, agire o archiviare)",
        "Riordinare l'app Note",
        "Riordinare le app dell'iPhone",
        'Riordinare il rullino foto',
    ],
    Casa: [
        'Fissare in calendario le pulizie',
        'Pianificare la spesa e fissare quando farla',
    ],
};

export const CHECKLIST_TEMPLATE: { area: string; text: string }[] =
    Object.entries(AREAS).flatMap(([area, texts]) =>
        texts.map((text) => ({ area, text }))
    );
