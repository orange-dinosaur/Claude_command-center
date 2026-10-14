/**
 * The gift recipients in alphabetical order, with how many ideas each has.
 */

import { apiFetch } from '@/auth/client';
import { useOnFocus } from '@/hooks/use-on-focus';

export interface RecipientSummary {
    id: string;
    name: string;
    ideas: number;
}

export const NAME_IN_USE = 'Hai già una persona con questo nome.';

const byName = (a: RecipientSummary, b: RecipientSummary) =>
    a.name.localeCompare(b.name, 'it', { sensitivity: 'base' });

export function useRecipients() {
    const { data, setData, error, setError, reload } = useOnFocus<
        RecipientSummary[]
    >(
        () =>
            apiFetch('/api/recipients').then((res) =>
                res.ok ? res.json() : Promise.reject()
            ),
        'Non riesco a caricare le persone.'
    );
    // undefined while loading the first time; a failed first load is empty.
    const recipients = data === null ? [] : data;

    /** Waits for the server, which knows whether the name is taken. */
    const add = async (name: string) => {
        setError(null);
        try {
            const res = await apiFetch('/api/recipients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            if (res.status === 409) {
                setError(NAME_IN_USE);
                return false;
            }
            if (!res.ok) throw new Error();
            const created: RecipientSummary = await res.json();
            setData((current) => [...(current ?? []), created].sort(byName));
            return true;
        } catch {
            setError('Non riesco ad aggiungere la persona.');
            return false;
        }
    };

    return { recipients, error, add, reload };
}
