/**
 * Glimmers grouped under the local month they happened in.
 */

/** The longest glimmer, in characters. */
export const TEXT_MAX = 1000;

export interface MonthGroup<T> {
    /** "Ottobre", or "Dicembre 2025" if not this year's. */
    title: string;
    glimmers: T[];
}

const monthFormatter = new Intl.DateTimeFormat('it-IT', { month: 'long' });

const dayFormatter = new Intl.DateTimeFormat('it-IT', {
    weekday: 'short',
    day: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
});

function monthTitle(date: Date, today: string): string {
    const name = monthFormatter.format(date);
    const title = name[0].toUpperCase() + name.slice(1);
    const year = date.getFullYear();
    return String(year) === today.slice(0, 4) ? title : `${title} ${year}`;
}

/** Glimmers already newest first, in groups of one local month each. */
export function groupByMonth<T extends { happenedAt: string }>(
    glimmers: T[],
    today: string
): MonthGroup<T>[] {
    const groups: (MonthGroup<T> & { month: string })[] = [];
    for (const glimmer of glimmers) {
        const date = new Date(glimmer.happenedAt);
        const month = `${date.getFullYear()}-${date.getMonth()}`;
        const last = groups.at(-1);
        if (last?.month === month) last.glimmers.push(glimmer);
        else
            groups.push({
                month,
                title: monthTitle(date, today),
                glimmers: [glimmer],
            });
    }
    return groups.map(({ title, glimmers }) => ({ title, glimmers }));
}

/** The local day and time of an ISO moment, "sab 11 · 18:40". */
export function formatMoment(moment: string): string {
    const date = new Date(moment);
    return `${dayFormatter.format(date)} · ${timeFormatter.format(date)}`;
}
