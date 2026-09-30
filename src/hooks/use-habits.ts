/**
 * The signed-in user's habits with their marked days. Marking a day shows at
 * once and rolls back if the save fails. The habit form saves the rest.
 */

import { apiFetch } from '@/auth/client';
import { dayOf, type Tracked } from '@/habits/stats';
import { useOnFocus } from '@/hooks/use-on-focus';

export interface Habit extends Tracked {
    id: string;
    name: string;
    sport: boolean;
    unit: string | null;
    position: number;
    archivedAt: string | null;
}

type Day = Habit['days'][number];

const json = (res: Response) => (res.ok ? res.json() : Promise.reject());

const send = (path: string, method: string, body?: object) =>
    apiFetch(path, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    }).then((res) => {
        if (!res.ok) throw new Error();
        return res;
    });

/** `days` with `date` set to `entry`, or cleared, still oldest first. */
function putDay(days: Day[], date: string, entry: Day | undefined): Day[] {
    const rest = days.filter((d) => d.date !== date);
    return entry
        ? [...rest, entry].sort((a, b) => a.date.localeCompare(b.date))
        : rest;
}

export function useHabits() {
    const { data, setData, error, setError, reload } = useOnFocus<Habit[]>(
        () => apiFetch('/api/habits').then(json),
        'Non riesco a caricare le abitudini.'
    );

    const setDay = (id: string, date: string, entry: Day | undefined) =>
        setData((current) =>
            current?.map((h) =>
                h.id === id ? { ...h, days: putDay(h.days, date, entry) } : h
            )
        );

    // ponytail: two quick taps on one cell can reach the server out of order;
    // queue requests per cell if that ever shows up.
    /** Marks a day, or clears it with `amount` 0 on an amount habit. */
    const mark = async (habit: Habit, date: string, amount?: number) => {
        if (habit.mode === 'amount' && !amount) return unmark(habit, date);
        const previous = dayOf(habit, date);
        setError(null);
        setDay(habit.id, date, { date, amount: amount ?? null });
        try {
            await send(`/api/habits/${habit.id}/days/${date}`, 'PUT', {
                amount,
            });
            return true;
        } catch {
            setDay(habit.id, date, previous);
            setError('Non riesco a salvare il giorno.');
            return false;
        }
    };

    const unmark = async (habit: Habit, date: string) => {
        const previous = dayOf(habit, date);
        setError(null);
        setDay(habit.id, date, undefined);
        try {
            await send(`/api/habits/${habit.id}/days/${date}`, 'DELETE');
            return true;
        } catch {
            setDay(habit.id, date, previous);
            setError('Non riesco a salvare il giorno.');
            return false;
        }
    };

    // undefined while loading the first time; a failed first load is empty.
    const habits = data === null ? [] : data;

    return { habits, error, reload, mark, unmark };
}
