import { monthTitle } from '@/glimmers/months';

export interface EndMonthGroup<T> {
    /** "Ottobre", "Dicembre 2025", or "Senza data". */
    title: string;
    titles: T[];
}

/**
 * Read titles, already newest end date first with the undated last, in groups
 * of one month each. The month comes from the date's text, since
 * `new Date('2026-10-31')` is UTC midnight and can land on the day before.
 */
export function groupByEndMonth<T extends { endDate: string | null }>(
    titles: T[],
    today: string
): EndMonthGroup<T>[] {
    const groups: (EndMonthGroup<T> & { month: string | null })[] = [];
    for (const t of titles) {
        const month = t.endDate?.slice(0, 7) ?? null;
        const last = groups.at(-1);
        if (last && last.month === month) last.titles.push(t);
        else
            groups.push({
                month,
                title:
                    month === null
                        ? 'Senza data'
                        : monthTitle(
                              new Date(
                                  Number(month.slice(0, 4)),
                                  Number(month.slice(5, 7)) - 1,
                                  1
                              ),
                              today
                          ),
                titles: [t],
            });
    }
    return groups.map(({ title, titles }) => ({ title, titles }));
}
