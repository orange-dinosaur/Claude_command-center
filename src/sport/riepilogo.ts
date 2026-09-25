/**
 * The Riepilogo counts and the month groups of the Sport page. Client-safe:
 * "today" is the device's day, since the server runs in UTC.
 */

import { addDays } from '@/dates';

interface Dated {
    /** `YYYY-MM-DD`. */
    date: string;
}

/** Workouts this week (Monday to Sunday) and this calendar month. */
export function countWorkouts(workouts: Dated[], today: string) {
    // getUTCDay is 0 on Sunday; step back to Monday.
    const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
    const monday = addDays(today, -((weekday + 6) % 7));
    const sunday = addDays(monday, 6);
    const month = today.slice(0, 7);

    return {
        week: workouts.filter((w) => w.date >= monday && w.date <= sunday)
            .length,
        month: workouts.filter((w) => w.date.startsWith(month)).length,
    };
}

const monthFormatter = new Intl.DateTimeFormat('it-IT', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
});

/** A `YYYY-MM` month as "Settembre 2026". */
export function formatMonth(month: string): string {
    const label = monthFormatter.format(new Date(`${month}-01T00:00:00Z`));
    return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Workouts, already newest first, grouped by `YYYY-MM`. The current month
 * always comes first, even with no workouts.
 */
export function groupByMonth<T extends Dated>(workouts: T[], today: string) {
    const groups: { month: string; workouts: T[] }[] = [
        { month: today.slice(0, 7), workouts: [] },
    ];
    for (const w of workouts) {
        const month = w.date.slice(0, 7);
        const last = groups[groups.length - 1];
        if (last.month === month) last.workouts.push(w);
        else groups.push({ month, workouts: [w] });
    }
    return groups;
}
