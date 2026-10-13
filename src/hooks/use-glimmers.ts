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
        'Non riesco a caricare i glimmer.'
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

    // undefined while loading the first time; a failed first load is empty.
    const glimmers = data === null ? [] : data;

    return { glimmers, error, setError, add };
}
