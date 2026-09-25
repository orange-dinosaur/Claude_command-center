/**
 * One bucket list season with its items. Every change is saved at once and
 * the season reloaded, since the server decides the order.
 */

import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { apiFetch } from '@/auth/client';
import type { SeasonName } from '@/bucket/season';
import { useReloadOnActive } from '@/hooks/use-bucket-seasons';

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
    const [season, setSeason] = useState<BucketSeason | null | undefined>(
        undefined
    );
    const [error, setError] = useState<string | null>(null);
    const [version, setVersion] = useState(0);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            apiFetch(`/api/bucket/${id}`)
                .then(async (res) => {
                    if (cancelled) return;
                    if (res.status === 404) return setSeason(null);
                    if (!res.ok) throw new Error();
                    setSeason(await res.json());
                    setError(null);
                })
                .catch(() => {
                    if (cancelled) return;
                    setSeason((current) => current ?? null);
                    setError('Non riesco a caricare la stagione.');
                });
            return () => {
                cancelled = true;
            };
            // version is listed only so that reload() fetches again.
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [id, version])
    );

    const reload = useCallback(() => setVersion((v) => v + 1), []);
    useReloadOnActive(reload);

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
