/**
 * The signed-in user's Semaforo items, oldest first. Every change shows at
 * once and is undone if the save fails.
 */

import { json } from '@/api';
import { apiFetch } from '@/auth/client';
import { useOnFocus } from '@/hooks/use-on-focus';
import type { Colour } from '@/semaforo/colours';

export interface Item {
    id: string;
    colour: Colour;
    name: string;
    createdAt: string;
}

const oldestFirst = (a: Item, b: Item) =>
    a.createdAt.localeCompare(b.createdAt);

export function useSemaforo() {
    const { data, setData, error, setError } = useOnFocus<Item[]>(
        () => apiFetch('/api/semaforo').then(json),
        'Non riesco a caricare il semaforo.',
        undefined,
        'semaforo'
    );

    /** False when the save failed, so the page can give the name back. */
    const add = async (colour: Colour, name: string) => {
        // Not crypto.randomUUID: the phone opens the LAN address over plain
        // http, where it does not exist.
        const temp: Item = {
            id: `new-${Date.now()}-${Math.random()}`,
            colour,
            name,
            createdAt: new Date().toISOString(),
        };
        setError(null);
        setData((current) => [...(current ?? []), temp]);
        try {
            const saved: Item = await apiFetch('/api/semaforo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ colour, name }),
            }).then(json);
            setData((current) =>
                current?.map((i) => (i.id === temp.id ? saved : i))
            );
            return true;
        } catch {
            setData((current) => current?.filter((i) => i.id !== temp.id));
            setError('Non riesco a salvare la voce.');
            return false;
        }
    };

    const remove = async (item: Item) => {
        setError(null);
        setData((current) => current?.filter((i) => i.id !== item.id));
        try {
            const res = await apiFetch(`/api/semaforo/${item.id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error();
        } catch {
            setData((current) => [...(current ?? []), item].sort(oldestFirst));
            setError('Non riesco a eliminare la voce.');
        }
    };

    // undefined while loading the first time; a failed first load is empty.
    const items = data === null ? [] : data;

    return { items, error, add, remove };
}
