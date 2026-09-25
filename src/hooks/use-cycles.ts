/**
 * The signed-in user's creativity cycles. Each hook reloads whenever the
 * screen comes back into view, so edits made on another page show up.
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
    openingNourishing: string | null;
    openingDraining: string | null;
    openingSuccess: string | null;
    /** The four setup checklist items, in order. */
    setup: boolean[];
    midpointShifted: string | null;
    midpointHelping: string | null;
    midpointSimplify: string | null;
    closingShift1: string | null;
    closingShift2: string | null;
    closingShift3: string | null;
    closingPractice: string | null;
    closingDiscovery: string | null;
    closingMade: string | null;
    closingBelief: string | null;
    closingPromise: string | null;
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

// data is undefined while loading the first time, null when there is none.
function useOnFocus<T>(load: () => Promise<T | null>, key?: string) {
    const [data, setData] = useState<T | null | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            load()
                .then((result) => {
                    if (cancelled) return;
                    setData(result);
                    setError(null);
                })
                .catch(() => {
                    if (cancelled) return;
                    setData((current) => current ?? null);
                    setError('Non riesco a caricare i dati.');
                });
            return () => {
                cancelled = true;
            };
            // load is a new closure each render; key says when it changes.
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [key])
    );

    return { data, error };
}

/** The cycle with this id, or the latest one when there is no id. */
export function useCycle(id?: string) {
    const { data, error } = useOnFocus<CycleWithWeeks>(
        () =>
            id
                ? apiFetch(`/api/cycles/${id}`).then(json)
                : apiFetch('/api/cycles')
                      .then(json)
                      .then((cycles: Cycle[]) =>
                          cycles.length
                              ? apiFetch(`/api/cycles/${cycles[0].id}`).then(
                                    json
                                )
                              : null
                      ),
        id
    );
    return { cycle: data, error };
}

/** Every cycle, newest first, without weeks. */
export function useCycles() {
    const { data, error } = useOnFocus<Cycle[]>(() =>
        apiFetch('/api/cycles').then(json)
    );
    return { cycles: data, error };
}
