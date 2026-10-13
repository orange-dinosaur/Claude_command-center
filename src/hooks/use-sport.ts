/**
 * The signed-in user's workouts and workout types.
 */

import { apiFetch } from '@/auth/client';
import { useOnFocus } from '@/hooks/use-on-focus';
import { desc, upsert } from '@/order';

export interface Workout {
    id: string;
    typeId: string;
    typeName: string;
    /** `YYYY-MM-DD`. */
    date: string;
    minutes: number | null;
    note: string | null;
    /** Taken from a lesson pack. */
    lesson: boolean;
    /** ISO timestamp, only for ordering. */
    createdAt: string;
}

const json = (res: Response) => (res.ok ? res.json() : Promise.reject());

export function useWorkouts() {
    const { data, setData, error, reload } = useOnFocus<Workout[]>(
        () => apiFetch('/api/workouts').then(json),
        'Non riesco a caricare i dati.'
    );
    // undefined while loading the first time; a failed first load is empty.
    const workouts = data === null ? [] : data;

    /** Takes a deleted workout off the list before the reload. */
    const drop = (id: string) =>
        setData((current) => current?.filter((w) => w.id !== id));

    /** Shows a saved workout in its place before the reload, newest first. */
    const put = (saved: Workout) =>
        setData(
            (current) =>
                current &&
                upsert(
                    current,
                    saved,
                    (a, b) =>
                        desc(a.date, b.date) || desc(a.createdAt, b.createdAt)
                )
        );

    return { workouts, error, reload, drop, put };
}

export interface WorkoutType {
    id: string;
    name: string;
    /** How many workouts use it. */
    workouts: number;
    activity: { id: string; archived: boolean } | null;
}

export function useWorkoutTypes() {
    const { data, setData, error } = useOnFocus<WorkoutType[]>(
        () => apiFetch('/api/workout-types').then(json),
        'Non riesco a caricare i tipi.'
    );
    // undefined while loading the first time; a failed first load is empty.
    const types = data === null ? [] : data;

    return { types, setTypes: setData, error };
}
