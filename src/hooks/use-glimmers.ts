/**
 * The signed-in user's glimmers, newest moment first. Every change shows at
 * once and is undone if the save fails.
 */

import { apiFetch } from '@/auth/client';
import { useOnFocus } from '@/hooks/use-on-focus';

export interface Glimmer {
    id: string;
    text: string;
    happenedAt: string;
}

const json = (res: Response) => (res.ok ? res.json() : Promise.reject());

const newestFirst = (list: Glimmer[]) =>
    list.sort((a, b) => b.happenedAt.localeCompare(a.happenedAt));

export function useGlimmers() {
    const { data, setData, error, setError } = useOnFocus<Glimmer[]>(
        () => apiFetch('/api/glimmers').then(json),
        'Non riesco a caricare i glimmer.',
        undefined,
        'glimmers'
    );

    /**
     * Saves at `happenedAt`, or now when it is undefined. False when the save
     * failed, so the page can give the text back.
     */
    const add = async (text: string, happenedAt?: string) => {
        // Not crypto.randomUUID: the phone opens the LAN address over plain
        // http, where it does not exist.
        const temp: Glimmer = {
            id: `new-${Date.now()}-${Math.random()}`,
            text,
            happenedAt: happenedAt ?? new Date().toISOString(),
        };
        setError(null);
        setData((current) => newestFirst([temp, ...(current ?? [])]));
        try {
            const saved: Glimmer = await apiFetch('/api/glimmers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, happenedAt }),
            }).then(json);
            setData((current) =>
                current?.map((g) => (g.id === temp.id ? saved : g))
            );
            return true;
        } catch {
            setData((current) => current?.filter((g) => g.id !== temp.id));
            setError('Non riesco a salvare il glimmer.');
            return false;
        }
    };

    const send = (glimmer: Glimmer, method: string, body?: object) =>
        apiFetch(`/api/glimmers/${glimmer.id}`, {
            method,
            headers: body ? { 'Content-Type': 'application/json' } : undefined,
            body: body ? JSON.stringify(body) : undefined,
        }).then((res) => {
            if (!res.ok) throw new Error();
        });

    const put = (glimmer: Glimmer) =>
        setData(
            (current) =>
                current &&
                newestFirst(
                    current.map((g) => (g.id === glimmer.id ? glimmer : g))
                )
        );

    const edit = async (
        glimmer: Glimmer,
        changes: Pick<Glimmer, 'text' | 'happenedAt'>
    ) => {
        setError(null);
        put({ ...glimmer, ...changes });
        try {
            await send(glimmer, 'PATCH', changes);
        } catch {
            put(glimmer);
            setError('Non riesco a salvare il glimmer.');
        }
    };

    const remove = async (glimmer: Glimmer) => {
        setError(null);
        setData((current) => current?.filter((g) => g.id !== glimmer.id));
        try {
            await send(glimmer, 'DELETE');
        } catch {
            setData((current) => newestFirst([...(current ?? []), glimmer]));
            setError('Non riesco a eliminare il glimmer.');
        }
    };

    // undefined while loading the first time; a failed first load is empty.
    const glimmers = data === null ? [] : data;

    return { glimmers, error, setError, add, edit, remove };
}
