/**
 * Cycle arithmetic shared by the API and the screens.
 */

import { addDays, daysBetween, formatDay } from '@/dates';

/** Days from a cycle's first Monday to its last Sunday. */
export const CYCLE_LAST_DAY = 83;

export const INTENT_LABELS = {
    intentPractice: 'La pratica creativa che voglio rinnovare',
    intentFeeling: 'Alla fine delle 12 settimane spero di sentirmi',
    intentProject: 'Un piccolo progetto che potrei esplorare',
} as const;

/** The Monday that starts week `week`, 1 to 12. */
export const weekStart = (startDate: string, week: number) =>
    addDays(startDate, (week - 1) * 7);

/** The week of the cycle that `day` falls in, 1 to 12, or null outside it. */
export function weekOf(startDate: string, day: string): number | null {
    const offset = daysBetween(startDate, day);
    return offset >= 0 && offset <= CYCLE_LAST_DAY
        ? Math.floor(offset / 7) + 1
        : null;
}

/** How many weeks an interrupted cycle keeps: those begun by that day. */
export const weeksBegun = (startDate: string, interruptedOn: string) =>
    Math.floor(daysBetween(startDate, interruptedOn) / 7) + 1;

export function cycleState(
    cycle: { startDate: string; endDate: string; interruptedOn: string | null },
    today: string
): string {
    if (cycle.interruptedOn) {
        const week = weeksBegun(cycle.startDate, cycle.interruptedOn);
        return `Interrotto alla settimana ${week}`;
    }
    if (today < cycle.startDate)
        return `Inizia il ${formatDay(cycle.startDate)}`;
    if (today > cycle.endDate) return 'Concluso';
    return 'In corso';
}
