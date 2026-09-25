/**
 * The signed-in user's latest creativity cycle, with its saved weeks. Reloads
 * whenever the screen comes back into view, so edits made on another page
 * show up.
 */

import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { apiFetch } from '@/auth/client';

export interface Cycle {
    id: string;
    startDate: string;
    /** The day it was interrupted, or its 12th Sunday. */
    endDate: string;
    interruptedOn: string | null;
    intentPractice: string | null;
    intentFeeling: string | null;
    intentProject: string | null;
}

export interface Week {
    week: number;
    /** Monday to Sunday. */
    dailyPages: boolean[];
    outing: boolean;
    tinyAction: boolean;
    evidence: boolean[];
    /** Half dots, 1 to 10. */
    energy: number | null;
    notes: string | null;
    carryForward: string | null;
    reviewed: boolean;
}

export type CycleWithWeeks = Cycle & { weeks: Week[] };

const json = (res: Response) => (res.ok ? res.json() : Promise.reject());

export function useCurrentCycle() {
    // undefined while loading the first time, null when there are no cycles.
    const [cycle, setCycle] = useState<CycleWithWeeks | null | undefined>(
        undefined
    );
    const [error, setError] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            apiFetch('/api/cycles')
                .then(json)
                .then((cycles: Cycle[]) =>
                    cycles.length
                        ? apiFetch(`/api/cycles/${cycles[0].id}`).then(json)
                        : null
                )
                .then((latest: CycleWithWeeks | null) => {
                    if (cancelled) return;
                    setCycle(latest);
                    setError(null);
                })
                .catch(() => {
                    if (cancelled) return;
                    setCycle((current) => current ?? null);
                    setError('Non riesco a caricare i dati.');
                });
            return () => {
                cancelled = true;
            };
        }, [])
    );

    return { cycle, error };
}
