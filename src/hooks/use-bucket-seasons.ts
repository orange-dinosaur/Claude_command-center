/**
 * The bucket list seasons, newest first, and preparing the next one. Reloads
 * when the screen comes back into view and when the app or browser tab does,
 * so what the partner added shows up.
 */

import { useState } from 'react';

import { apiFetch } from '@/auth/client';
import type { SeasonName } from '@/bucket/season';
import { todayDay } from '@/dates';
import { useOnFocus } from '@/hooks/use-on-focus';

export interface SeasonSummary {
    id: string;
    year: number;
    season: SeasonName;
    done: number;
    total: number;
}

export function useBucketSeasons() {
    const { data, error, setError, reload } = useOnFocus<SeasonSummary[]>(
        () =>
            apiFetch(`/api/bucket?today=${todayDay()}`)
                .then((res) => (res.ok ? res.json() : Promise.reject()))
                .then((body: { seasons: SeasonSummary[] }) => body.seasons),
        'Non riesco a caricare le stagioni.',
        undefined,
        'bucket-seasons'
    );
    // undefined while loading the first time; a failed first load is empty.
    const seasons = data === null ? [] : data;
    const [busy, setBusy] = useState(false);

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
