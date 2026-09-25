/**
 * The signed-in user's workouts and workout types.
 */

import { apiFetch } from '@/auth/client';
import { useOnFocus } from '@/hooks/use-on-focus';

export interface Workout {
    id: string;
    typeId: string;
    typeName: string;
    /** `YYYY-MM-DD`. */
    date: string;
    minutes: number | null;
    note: string | null;
}

const json = (res: Response) => (res.ok ? res.json() : Promise.reject());

export function useWorkouts() {
    const { data, error, reload } = useOnFocus<Workout[]>(
        () => apiFetch('/api/workouts').then(json),
        'Non riesco a caricare i dati.'
    );
    // undefined while loading the first time; a failed first load is empty.
    const workouts = data === null ? [] : data;

    return { workouts, error, reload };
}

export interface WorkoutType {
    id: string;
    name: string;
    /** How many workouts use it. */
    workouts: number;
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
