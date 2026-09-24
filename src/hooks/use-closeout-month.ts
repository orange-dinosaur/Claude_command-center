/**
 * One closeout month with its answers and checklist, and deleting it.
 */

import { useEffect, useState } from 'react';

import { apiFetch } from '@/auth/client';

export interface ChecklistItem {
    id: string;
    area: string;
    text: string;
    done: boolean;
}

export interface Month {
    id: string;
    year: number;
    month: number;
    answers: Record<string, string>;
    items: ChecklistItem[];
}

export function useCloseoutMonth(id: string) {
    // undefined while loading, null when it does not exist.
    const [month, setMonth] = useState<Month | null | undefined>(undefined);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        apiFetch(`/api/closeout/${id}`)
            .then((res) => {
                if (res.status === 404) return null;
                return res.ok ? res.json() : Promise.reject();
            })
            .then((body: Month | null) => {
                if (!cancelled) setMonth(body);
            })
            .catch(() => {
                if (!cancelled) {
                    setMonth(null);
                    setError('Non riesco a caricare il mese.');
                }
            });
        return () => {
            cancelled = true;
        };
    }, [id]);

    /** Resolves to true once the month is gone. */
    const remove = async (): Promise<boolean> => {
        setBusy(true);
        setError(null);
        try {
            const res = await apiFetch(`/api/closeout/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok && res.status !== 404) throw new Error();
            return true;
        } catch {
            setError('Non riesco a eliminare il mese.');
            return false;
        } finally {
            setBusy(false);
        }
    };

    return { month, busy, error, remove };
}
