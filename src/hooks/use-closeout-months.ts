/**
 * The signed-in user's closeout months, newest first, and creating one.
 * Reloads whenever the screen comes back into view, so the progress counts
 * follow what was ticked inside a month.
 */

import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { apiFetch } from '@/auth/client';

export interface MonthSummary {
    id: string;
    year: number;
    month: number;
    done: number;
    total: number;
}

export function useCloseoutMonths() {
    // undefined while loading the first time.
    const [months, setMonths] = useState<MonthSummary[] | undefined>(undefined);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            apiFetch('/api/closeout')
                .then((res) => (res.ok ? res.json() : Promise.reject()))
                .then((body: { months: MonthSummary[] }) => {
                    if (cancelled) return;
                    setMonths(body.months);
                    setError(null);
                })
                .catch(() => {
                    if (cancelled) return;
                    setMonths((current) => current ?? []);
                    setError('Non riesco a caricare i mesi.');
                });
            return () => {
                cancelled = true;
            };
        }, [])
    );

    /** Resolves to the month's id, new or existing, or null on failure. */
    const create = async (
        year: number,
        month: number
    ): Promise<string | null> => {
        setBusy(true);
        setError(null);
        try {
            const res = await apiFetch('/api/closeout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ year, month }),
            });
            if (!res.ok) throw new Error();
            const body: { id: string } = await res.json();
            return body.id;
        } catch {
            setError('Non riesco a creare il mese.');
            return null;
        } finally {
            setBusy(false);
        }
    };

    return { months, busy, error, create };
}
