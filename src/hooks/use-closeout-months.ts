/**
 * The signed-in user's closeout months, newest first, and creating one.
 */

import { useState } from 'react';

import { apiFetch } from '@/auth/client';
import { useOnFocus } from '@/hooks/use-on-focus';

export interface MonthSummary {
    id: string;
    year: number;
    month: number;
    done: number;
    total: number;
}

export function useCloseoutMonths() {
    const { data, setData, error, setError, reload } = useOnFocus<
        MonthSummary[]
    >(
        () =>
            apiFetch('/api/closeout')
                .then((res) => (res.ok ? res.json() : Promise.reject()))
                .then((body: { months: MonthSummary[] }) => body.months),
        'Non riesco a caricare i mesi.',
        undefined,
        'closeout-months'
    );
    // undefined while loading the first time; a failed first load is empty.
    const months = data === null ? [] : data;
    const [busy, setBusy] = useState(false);

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

    /** Takes a deleted month off the list before the reload. */
    const drop = (id: string) =>
        setData((current) => current?.filter((m) => m.id !== id));

    return { months, busy, error, create, reload, drop };
}
