/**
 * Week and month maths for the habit tracker. Client-safe. Days are
 * `YYYY-MM-DD`, months `YYYY-MM`, and weeks run Monday to Sunday.
 */

import { addDays, toDay } from '@/dates';

export const WEEKLY_MAX = 7;
/** Caps both an amount habit's daily target and a day's number. */
export const AMOUNT_MAX = 100000;
export const UNIT_MAX = 30;

export interface Tracked {
    mode: 'daily' | 'weekly' | 'amount';
    weeklyTarget: number | null;
    dailyTarget: number | null;
    /** ISO timestamp. */
    createdAt: string;
    /** Marked days, oldest first. */
    days: { date: string; amount: number | null }[];
}

export function mondayOf(day: string): string {
    // getUTCDay is 0 on Sunday; step back to Monday.
    const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
    return addDays(day, -((weekday + 6) % 7));
}

export const weekDays = (monday: string) =>
    Array.from({ length: 7 }, (_, i) => addDays(monday, i));

/** Every day of a month, first to last. */
export function monthDays(month: string): string[] {
    const [year, m] = month.split('-').map(Number);
    const count = new Date(Date.UTC(year, m, 0)).getUTCDate();
    return Array.from({ length: count }, (_, i) => toDay(year, m, i + 1));
}

export const dayOf = (habit: Tracked, day: string) =>
    habit.days.find((d) => d.date === day);

export function isDone(habit: Tracked, day: string): boolean {
    const marked = dayOf(habit, day);
    if (!marked) return false;
    return (
        habit.mode !== 'amount' || (marked.amount ?? 0) >= habit.dailyTarget!
    );
}

/** Done days in the week that starts on `monday`. */
export const weekCount = (habit: Tracked, monday: string) =>
    weekDays(monday).filter((day) => isDone(habit, day)).length;

/**
 * Done days out of the month's days. Weekly habits also get the weeks that
 * reached the target, out of the weeks whose Sunday falls in the month.
 */
export function monthSummary(
    habit: Tracked,
    month: string
): { done: number; days: number; weeks?: { reached: number; total: number } } {
    const days = monthDays(month);
    const summary = {
        done: days.filter((day) => isDone(habit, day)).length,
        days: days.length,
    };
    if (habit.mode !== 'weekly') return summary;

    const sundays = days.filter(
        (day) => new Date(`${day}T00:00:00Z`).getUTCDay() === 0
    );
    const reached = sundays.filter(
        (sunday) => weekCount(habit, addDays(sunday, -6)) >= habit.weeklyTarget!
    ).length;
    return { ...summary, weeks: { reached, total: sundays.length } };
}

/**
 * The months a habit has history for, newest first: from the earlier of its
 * creation and its first marked day, to today's month.
 */
export function historyMonths(habit: Tracked, today: string): string[] {
    const created = habit.createdAt.slice(0, 7);
    const first = habit.days[0]?.date.slice(0, 7);
    let month = first && first < created ? first : created;
    const months: string[] = [];
    while (month <= today.slice(0, 7)) {
        months.unshift(month);
        // The 28th plus 4 days always lands in the next month.
        month = addDays(`${month}-28`, 4).slice(0, 7);
    }
    return months;
}
