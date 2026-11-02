/**
 * One gift recipient with all their gifts: adding, changing and deleting
 * gifts, renaming the recipient, and deleting them with their gifts.
 */

import { apiFetch } from '@/auth/client';
import { useOnFocus } from '@/hooks/use-on-focus';
import { NAME_IN_USE } from '@/hooks/use-recipients';

export interface Gift {
    id: string;
    name: string;
    occasion: string | null;
    priceCents: number | null;
    link: string | null;
    /** null while it is an idea. */
    givenOn: string | null;
    createdAt: string;
}

export interface Recipient {
    name: string;
    gifts: Gift[];
}

export type GiftChanges = Partial<Omit<Gift, 'id' | 'createdAt'>>;

const json = { 'Content-Type': 'application/json' };

export function useRecipient(id: string, onChanged?: () => void) {
    // undefined while loading, null when missing.
    const {
        data: recipient,
        setData: setRecipient,
        error,
        setError,
    } = useOnFocus<Recipient>(
        () =>
            apiFetch(`/api/recipients/${id}/gifts`).then((res) => {
                if (res.status === 404) return null;
                return res.ok ? res.json() : Promise.reject();
            }),
        'Non riesco a caricare i regali.',
        id,
        `recipient.${id}`
    );

    const setGifts = (change: (gifts: Gift[]) => Gift[]) =>
        setRecipient((current) =>
            current ? { ...current, gifts: change(current.gifts) } : current
        );

    const add = async (fields: GiftChanges & { name: string }) => {
        setError(null);
        try {
            const res = await apiFetch(`/api/recipients/${id}/gifts`, {
                method: 'POST',
                headers: json,
                body: JSON.stringify(fields),
            });
            if (!res.ok) throw new Error();
            const created: Gift = await res.json();
            setGifts((gifts) => [...gifts, created]);
            onChanged?.();
            return true;
        } catch {
            setError('Non riesco ad aggiungere il regalo.');
            return false;
        }
    };

    /**
     * Applies the change at once, then takes the server's copy, which has the
     * link completed; rolls back if the save fails.
     */
    const update = async (gift: Gift, changes: GiftChanges) => {
        const replace = (next: Gift) =>
            setGifts((gifts) =>
                gifts.map((g) => (g.id === gift.id ? next : g))
            );
        setError(null);
        replace({ ...gift, ...changes });
        try {
            const res = await apiFetch(`/api/gifts/${gift.id}`, {
                method: 'PATCH',
                headers: json,
                body: JSON.stringify(changes),
            });
            if (!res.ok) throw new Error();
            replace(await res.json());
            onChanged?.();
        } catch {
            replace(gift);
            setError('Non riesco a salvare il regalo.');
        }
    };

    /** Removes at once and puts the gift back if the delete fails. */
    const removeGift = async (gift: Gift) => {
        setError(null);
        setGifts((gifts) => gifts.filter((g) => g.id !== gift.id));
        try {
            const res = await apiFetch(`/api/gifts/${gift.id}`, {
                method: 'DELETE',
            });
            if (!res.ok && res.status !== 404) throw new Error();
            onChanged?.();
        } catch {
            // Gifts show sorted, so the end of the list is as good as any.
            setGifts((gifts) => [...gifts, gift]);
            setError('Non riesco a eliminare il regalo.');
        }
    };

    const rename = async (name: string) => {
        setError(null);
        try {
            const res = await apiFetch(`/api/recipients/${id}`, {
                method: 'PATCH',
                headers: json,
                body: JSON.stringify({ name }),
            });
            if (res.status === 409) {
                setError(NAME_IN_USE);
                return false;
            }
            if (!res.ok) throw new Error();
            setRecipient((current) => current && { ...current, name });
            onChanged?.();
            return true;
        } catch {
            setError('Non riesco a rinominare la persona.');
            return false;
        }
    };

    const remove = async () => {
        setError(null);
        try {
            const res = await apiFetch(`/api/recipients/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok && res.status !== 404) throw new Error();
            onChanged?.();
            return true;
        } catch {
            setError('Non riesco a eliminare la persona.');
            return false;
        }
    };

    return { recipient, error, add, update, removeGift, rename, remove };
}
