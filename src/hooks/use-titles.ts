/**
 * The signed-in user's titles of every kind, split by status in the order the
 * API gives them. Reloads whenever the screen comes back into view, so edits
 * made on another page show up.
 */

import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { apiFetch } from '@/auth/client';

export type Kind = 'book' | 'film' | 'series';
export type Status = 'doing' | 'todo' | 'done';

export interface Title {
    id: string;
    kind: Kind;
    name: string;
    author: string | null;
    format: string | null;
    season: number | null;
    status: Status;
    startDate: string | null;
    endDate: string | null;
    /** Half stars, 1 to 10. */
    rating: number | null;
}

export type Sections = Record<Status, Title[]>;

const KINDS: Kind[] = ['book', 'film', 'series'];

const empty = (): Sections => ({ doing: [], todo: [], done: [] });

const json = (res: Response) => (res.ok ? res.json() : Promise.reject());

export function useTitles() {
    // undefined while loading the first time.
    const [titles, setTitles] = useState<Record<Kind, Sections> | undefined>(
        undefined
    );
    const [error, setError] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            Promise.all(
                KINDS.map((kind) =>
                    apiFetch(`/api/titles?kind=${kind}`).then(json)
                )
            )
                .then(([book, film, series]) => {
                    if (cancelled) return;
                    setTitles({ book, film, series });
                    setError(null);
                })
                .catch(() => {
                    if (cancelled) return;
                    setTitles(
                        (current) =>
                            current ?? {
                                book: empty(),
                                film: empty(),
                                series: empty(),
                            }
                    );
                    setError('Non riesco a caricare i dati.');
                });
            return () => {
                cancelled = true;
            };
        }, [])
    );

    return { titles, error };
}
