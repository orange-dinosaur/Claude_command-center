/**
 * Brain dump entries grouped under the local day they were written.
 */

import { addDays, toDay } from '@/dates';

export interface DayGroup<T> {
    /** "Oggi", "Ieri", "lunedì 28 settembre", or with the year if not this year's. */
    title: string;
    entries: T[];
}

const titleFormatter = new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
});

const yearTitleFormatter = new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
});

const timeFormatter = new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
});

/** The local `YYYY-MM-DD` of an ISO moment. */
function localDay(moment: string): string {
    const d = new Date(moment);
    return toDay(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function dayTitle(day: string, today: string): string {
    if (day === today) return 'Oggi';
    if (day === addDays(today, -1)) return 'Ieri';
    const format =
        day.slice(0, 4) === today.slice(0, 4)
            ? titleFormatter
            : yearTitleFormatter;
    return format.format(new Date(`${day}T00:00:00Z`));
}

/** Entries already newest first, in groups of one local day each. */
export function groupByDay<T extends { createdAt: string }>(
    entries: T[],
    today: string
): DayGroup<T>[] {
    const groups: (DayGroup<T> & { day: string })[] = [];
    for (const entry of entries) {
        const day = localDay(entry.createdAt);
        const last = groups.at(-1);
        if (last?.day === day) last.entries.push(entry);
        else
            groups.push({ day, title: dayTitle(day, today), entries: [entry] });
    }
    return groups.map(({ title, entries }) => ({ title, entries }));
}

/** The local time of an ISO moment, "14:32". */
export const formatTime = (moment: string) =>
    timeFormatter.format(new Date(moment));
