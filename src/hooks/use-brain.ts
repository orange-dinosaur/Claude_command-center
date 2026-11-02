/**
 * The signed-in user's brain dump, newest first. Every change shows at once
 * and is undone if the save fails.
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
        'Non riesco a caricare il brain dump.',
        undefined,
        'brain'
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

    const send = (entry: Entry, method: string, body?: object) =>
        apiFetch(`/api/brain/${entry.id}`, {
            method,
            headers: body ? { 'Content-Type': 'application/json' } : undefined,
            body: body ? JSON.stringify(body) : undefined,
        }).then((res) => {
            if (!res.ok) throw new Error();
        });

    const put = (entry: Entry) =>
        setData((current) =>
            current?.map((e) => (e.id === entry.id ? entry : e))
        );

    const edit = async (entry: Entry, text: string) => {
        setError(null);
        put({ ...entry, text });
        try {
            await send(entry, 'PATCH', { text });
        } catch {
            put(entry);
            setError('Non riesco a salvare la voce.');
        }
    };

    const remove = async (entry: Entry) => {
        setError(null);
        setData((current) => current?.filter((e) => e.id !== entry.id));
        try {
            await send(entry, 'DELETE');
        } catch {
            setData((current) =>
                [...(current ?? []), entry].sort((a, b) =>
                    b.createdAt.localeCompare(a.createdAt)
                )
            );
            setError('Non riesco a eliminare la voce.');
        }
    };

    // undefined while loading the first time; a failed first load is empty.
    const entries = data === null ? [] : data;

    return { entries, error, add, edit, remove };
}
