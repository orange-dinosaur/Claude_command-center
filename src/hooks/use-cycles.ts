/**
 * The signed-in user's creativity cycles.
 */

import { json } from '@/api';
import { apiFetch } from '@/auth/client';
import { weeksBegun } from '@/creativity/cycle';
import { useOnFocus } from '@/hooks/use-on-focus';

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

const FAILURE = 'Non riesco a caricare i dati.';

/** The cycle with this id, or the latest one when there is no id. */
export function useCycle(id?: string) {
    const { data, setData, error, reload } = useOnFocus<CycleWithWeeks>(
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
        FAILURE,
        id,
        `cycle.${id ?? 'latest'}`
    );
    /** Shows the loading state until the next cycle arrives. */
    const clear = () => setData(undefined);

    /**
     * Shows a saved cycle before the reload. It keeps the loaded weeks,
     * without those an interruption deletes; a new cycle has none yet.
     */
    const put = (saved: Cycle) =>
        setData((current) => ({
            ...saved,
            weeks:
                current?.id !== saved.id
                    ? []
                    : saved.interruptedOn
                      ? current.weeks.filter(
                            (w) =>
                                w.week <=
                                weeksBegun(
                                    saved.startDate,
                                    saved.interruptedOn!
                                )
                        )
                      : current.weeks,
        }));

    return { cycle: data, error, reload, clear, put };
}

/** Every cycle, newest first, without weeks. */
export function useCycles() {
    const { data, error, reload } = useOnFocus<Cycle[]>(
        () => apiFetch('/api/cycles').then(json),
        FAILURE,
        undefined,
        'cycles'
    );
    return { cycles: data, error, reload };
}
