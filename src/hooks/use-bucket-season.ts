/**
 * One bucket list season with its items. Every change is saved at once and
 * the season reloaded, since the server decides the order.
 */

import { apiFetch } from '@/auth/client';
import type { SeasonName } from '@/bucket/season';
import { useOnFocus } from '@/hooks/use-on-focus';

export interface BucketItem {
    id: string;
    text: string;
    doneOn: string | null;
    /** The author's initial, or null when their account is gone. */
    addedBy: string | null;
}

export interface BucketSeason {
    id: string;
    year: number;
    season: SeasonName;
    items: BucketItem[];
}

export function useBucketSeason(id: string, onChanged?: () => void) {
    // undefined while loading, null when missing.
    const {
        data: season,
        error,
        setError,
        reload,
    } = useOnFocus<BucketSeason>(
        () =>
            apiFetch(`/api/bucket/${id}`).then((res) => {
                if (res.status === 404) return null;
                return res.ok ? res.json() : Promise.reject();
            }),
        'Non riesco a caricare la stagione.',
        id
    );

    const send = async (path: string, init: RequestInit, failure: string) => {
        setError(null);
        try {
            const res = await apiFetch(path, {
                ...init,
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) throw new Error();
            reload();
            onChanged?.();
            return true;
        } catch {
            setError(failure);
            return false;
        }
    };

    const add = (text: string) =>
        send(
            `/api/bucket/${id}`,
            { method: 'POST', body: JSON.stringify({ text }) },
            'Non riesco ad aggiungere la voce.'
        );

    const update = (
        item: BucketItem,
        changes: { text?: string; doneOn?: string | null }
    ) =>
        send(
            `/api/bucket/items/${item.id}`,
            { method: 'PATCH', body: JSON.stringify(changes) },
            'Non riesco a salvare la voce.'
        );

    const remove = (item: BucketItem) =>
        send(
            `/api/bucket/items/${item.id}`,
            { method: 'DELETE' },
            'Non riesco a eliminare la voce.'
        );

    return { season, error, add, update, remove, reload };
}
