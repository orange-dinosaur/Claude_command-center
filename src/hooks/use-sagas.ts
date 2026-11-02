/**
 * The signed-in user's sagas, archived ones included.
 */

import { useRef } from 'react';

import { apiFetch } from '@/auth/client';
import { useOnFocus } from '@/hooks/use-on-focus';
import { tapVolume } from '@/media/sagas';

export interface Saga {
    id: string;
    name: string;
    author: string | null;
    language: string | null;
    audiobook: boolean;
    volumes: number;
    /** Volumes read, counted from the first. */
    volumesRead: number;
    /** Free text such as "marzo 2027". */
    nextRelease: string | null;
    archivedAt: string | null;
    createdAt: string;
}

const json = (res: Response) => (res.ok ? res.json() : Promise.reject());

export function useSagas() {
    const { data, setData, error, setError, reload } = useOnFocus<Saga[]>(
        () => apiFetch('/api/sagas').then(json),
        'Non riesco a caricare le saghe.'
    );

    /** Takes a deleted saga off the list before the reload. */
    const drop = (id: string) =>
        setData((current) => current?.filter((s) => s.id !== id));

    /** Shows a saved saga in the list before the reload. */
    const put = (saved: Saga) =>
        setData(
            (current) =>
                current && [...current.filter((s) => s.id !== saved.id), saved]
        );

    // Taps on one saga go out one after another, so they reach the server in
    // order.
    const pending = useRef(new Map<string, Promise<unknown>>());

    /**
     * Marks volumes read up to `volume`, as a tap on its dot does. Resolves to
     * whether the server saved it.
     */
    const mark = async (saga: Saga, volume: number) => {
        const volumesRead = tapVolume(saga.volumesRead, volume);
        setError(null);
        put({ ...saga, volumesRead });
        const request = (pending.current.get(saga.id) ?? Promise.resolve())
            .catch(() => {})
            .then(() =>
                apiFetch(`/api/sagas/${saga.id}`, {
                    method: 'PATCH',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ volumesRead }),
                })
            )
            .then((res) => {
                if (!res.ok) throw new Error();
            });
        pending.current.set(saga.id, request);
        try {
            await request;
            return true;
        } catch {
            put(saga);
            setError('Non riesco a salvare il volume.');
            return false;
        }
    };

    return { sagas: data, error, reload, drop, put, mark };
}
