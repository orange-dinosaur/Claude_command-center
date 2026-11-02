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
        setData: setSeason,
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
        id,
        `bucket-season.${id}`
    );

    const setItems = (change: (items: BucketItem[]) => BucketItem[]) =>
        setSeason((current) =>
            current ? { ...current, items: change(current.items) } : current
        );

    const add = async (text: string) => {
        setError(null);
        try {
            const res = await apiFetch(`/api/bucket/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });
            if (!res.ok) throw new Error();
            reload();
            onChanged?.();
            return true;
        } catch {
            setError('Non riesco ad aggiungere la voce.');
            return false;
        }
    };

    /** Applies the change at once and rolls it back if the save fails. */
    const update = async (
        item: BucketItem,
        changes: { text?: string; doneOn?: string | null }
    ) => {
        setError(null);
        setItems((items) =>
            items.map((i) => (i.id === item.id ? { ...i, ...changes } : i))
        );
        try {
            const res = await apiFetch(`/api/bucket/items/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(changes),
            });
            if (!res.ok) throw new Error();
            onChanged?.();
            return true;
        } catch {
            setItems((items) =>
                items.map((i) => (i.id === item.id ? item : i))
            );
            setError('Non riesco a salvare la voce.');
            return false;
        }
    };

    /** Removes at once and puts the item back if the delete fails. */
    const remove = async (item: BucketItem) => {
        const index = season?.items.findIndex((i) => i.id === item.id) ?? -1;
        setError(null);
        setItems((items) => items.filter((i) => i.id !== item.id));
        try {
            const res = await apiFetch(`/api/bucket/items/${item.id}`, {
                method: 'DELETE',
            });
            if (!res.ok && res.status !== 404) throw new Error();
            onChanged?.();
            return true;
        } catch {
            setItems((items) => [
                ...items.slice(0, index),
                item,
                ...items.slice(index),
            ]);
            setError('Non riesco a eliminare la voce.');
            return false;
        }
    };

    return { season, error, add, update, remove, reload };
}
