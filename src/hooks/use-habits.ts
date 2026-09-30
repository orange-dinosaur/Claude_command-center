/**
 * The signed-in user's habits with their marked days. Marking a day shows at
 * once and rolls back if the save fails. The habit form saves the rest.
 */

import { useRef } from 'react';

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

    // Requests for one habit and day go out one after another, so quick taps
    // reach the server in order. ponytail: if two queued requests both fail,
    // the second rollback restores the first tap's state; a reload fixes it.
    const pending = useRef(new Map<string, Promise<unknown>>());

    const sendDay = (
        id: string,
        date: string,
        method: string,
        body?: object
    ) => {
        const key = `${id}:${date}`;
        const request = (pending.current.get(key) ?? Promise.resolve())
            .catch(() => {})
            .then(() => send(`/api/habits/${id}/days/${date}`, method, body));
        pending.current.set(key, request);
        return request;
    };

    /** Marks a day, or clears it with `amount` 0 on an amount habit. */
    const mark = async (habit: Habit, date: string, amount?: number) => {
        if (habit.mode === 'amount' && !amount) return unmark(habit, date);
        const previous = dayOf(habit, date);
        setError(null);
        setDay(habit.id, date, { date, amount: amount ?? null });
        try {
            await sendDay(habit.id, date, 'PUT', { amount });
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
            await sendDay(habit.id, date, 'DELETE');
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
