/**
 * The bucket list seasons, newest first, and preparing the next one. Reloads
 * when the screen comes back into view and when the app or browser tab does,
 * so what the partner added shows up.
 */

import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { apiFetch } from '@/auth/client';
import type { SeasonName } from '@/bucket/season';
import { todayDay } from '@/dates';

export interface SeasonSummary {
    id: string;
    year: number;
    season: SeasonName;
    done: number;
    total: number;
}

/** Reloads when the app comes back to the foreground; on web, the tab. */
export function useReloadOnActive(reload: () => void) {
    useEffect(() => {
        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'active') reload();
        });
        return () => sub.remove();
    }, [reload]);
}

export function useBucketSeasons() {
    // undefined while loading the first time.
    const [seasons, setSeasons] = useState<SeasonSummary[] | undefined>(
        undefined
    );
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Bumped by `reload` for pages that change the data without losing focus.
    const [version, setVersion] = useState(0);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            apiFetch(`/api/bucket?today=${todayDay()}`)
                .then((res) => (res.ok ? res.json() : Promise.reject()))
                .then((body: { seasons: SeasonSummary[] }) => {
                    if (cancelled) return;
                    setSeasons(body.seasons);
                    setError(null);
                })
                .catch(() => {
                    if (cancelled) return;
                    setSeasons((current) => current ?? []);
                    setError('Non riesco a caricare le stagioni.');
                });
            return () => {
                cancelled = true;
            };
            // version is listed only so that reload() fetches again.
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [version])
    );

    const reload = useCallback(() => setVersion((v) => v + 1), []);
    useReloadOnActive(reload);

    /** Resolves to the next season's id, or null on failure. */
    const prepareNext = async (): Promise<string | null> => {
        setBusy(true);
        setError(null);
        try {
            const res = await apiFetch(`/api/bucket?today=${todayDay()}`, {
                method: 'POST',
            });
            if (!res.ok) throw new Error();
            const body: { id: string } = await res.json();
            return body.id;
        } catch {
            setError('Non riesco a creare la stagione.');
            return null;
        } finally {
            setBusy(false);
        }
    };

    return { seasons, busy, error, prepareNext, reload };
}
