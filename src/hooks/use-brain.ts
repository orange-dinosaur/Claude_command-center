/**
 * The signed-in user's brain dump, newest first. A new entry shows at once
 * and goes away again if the save fails.
 */

import { apiFetch } from '@/auth/client';
import { useOnFocus } from '@/hooks/use-on-focus';

export interface Entry {
    id: string;
    text: string;
    createdAt: string;
}

const json = (res: Response) => (res.ok ? res.json() : Promise.reject());

export function useBrain() {
    const { data, setData, error, setError } = useOnFocus<Entry[]>(
        () => apiFetch('/api/brain').then(json),
        'Non riesco a caricare il brain dump.'
    );

    /** False when the save failed, so the page can give the text back. */
    const add = async (text: string) => {
        // Not crypto.randomUUID: the phone opens the LAN address over plain
        // http, where it does not exist.
        const temp: Entry = {
            id: `new-${Date.now()}-${Math.random()}`,
            text,
            createdAt: new Date().toISOString(),
        };
        setError(null);
        setData((current) => [temp, ...(current ?? [])]);
        try {
            const saved: Entry = await apiFetch('/api/brain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            }).then(json);
            setData((current) =>
                current?.map((e) => (e.id === temp.id ? saved : e))
            );
            return true;
        } catch {
            setData((current) => current?.filter((e) => e.id !== temp.id));
            setError('Non riesco a salvare la voce.');
            return false;
        }
    };

    // undefined while loading the first time; a failed first load is empty.
    const entries = data === null ? [] : data;

    return { entries, error, add };
}
