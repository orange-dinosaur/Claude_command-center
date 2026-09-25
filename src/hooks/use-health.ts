/**
 * The signed-in user's check-ups and medicines, in the order the API gives
 * them. Reloads whenever the screen comes back into view, so edits made on
 * another page show up.
 */

import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { apiFetch } from '@/auth/client';

export interface Checkup {
    id: string;
    name: string;
    lastDate: string | null;
}

export interface Medicine {
    id: string;
    name: string;
    frequency: string | null;
    startDate: string | null;
    endDate: string | null;
}

interface Health {
    checkups: Checkup[];
    ongoing: Medicine[];
    ended: Medicine[];
}

const json = (res: Response) => (res.ok ? res.json() : Promise.reject());

export function useHealth() {
    // undefined while loading the first time.
    const [health, setHealth] = useState<Health | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);
    // Bumped by `reload` for pages that change the data without losing focus.
    const [version, setVersion] = useState(0);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            Promise.all([
                apiFetch('/api/checkups').then(json),
                apiFetch('/api/medicines').then(json),
            ])
                .then(([checkups, medicines]) => {
                    if (cancelled) return;
                    setHealth({ checkups, ...medicines });
                    setError(null);
                })
                .catch(() => {
                    if (cancelled) return;
                    setHealth(
                        (current) =>
                            current ?? { checkups: [], ongoing: [], ended: [] }
                    );
                    setError('Non riesco a caricare i dati.');
                });
            return () => {
                cancelled = true;
            };
            // version is listed only so that reload() fetches again.
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [version])
    );

    const reload = useCallback(() => setVersion((v) => v + 1), []);

    return { health, error, reload };
}
