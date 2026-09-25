/**
 * The signed-in user's workouts and workout types, reloaded whenever the
 * screen comes into focus, so lists are fresh after a form closes.
 */

import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { apiFetch } from '@/auth/client';

export interface Workout {
    id: string;
    typeId: string;
    typeName: string;
    /** `YYYY-MM-DD`. */
    date: string;
    minutes: number | null;
    note: string | null;
}

export function useWorkouts() {
    // undefined while loading the first time.
    const [workouts, setWorkouts] = useState<Workout[] | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            apiFetch('/api/workouts')
                .then((res) => (res.ok ? res.json() : Promise.reject()))
                .then((list: Workout[]) => {
                    if (cancelled) return;
                    setWorkouts(list);
                    setError(null);
                })
                .catch(() => {
                    if (cancelled) return;
                    setWorkouts((current) => current ?? []);
                    setError('Non riesco a caricare i dati.');
                });
            return () => {
                cancelled = true;
            };
        }, [])
    );

    return { workouts, error };
}

export interface WorkoutType {
    id: string;
    name: string;
    /** How many workouts use it. */
    workouts: number;
}

export function useWorkoutTypes() {
    // undefined while loading the first time.
    const [types, setTypes] = useState<WorkoutType[] | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            apiFetch('/api/workout-types')
                .then((res) => (res.ok ? res.json() : Promise.reject()))
                .then((list: WorkoutType[]) => {
                    if (cancelled) return;
                    setTypes(list);
                    setError(null);
                })
                .catch(() => {
                    if (cancelled) return;
                    setTypes((current) => current ?? []);
                    setError('Non riesco a caricare i tipi.');
                });
            return () => {
                cancelled = true;
            };
        }, [])
    );

    return { types, setTypes, error };
}
