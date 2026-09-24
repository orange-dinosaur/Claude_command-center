/**
 * One closeout month with its answers and checklist, the saves that change
 * them, and deleting the month.
 */

import { useEffect, useState } from 'react';

import { apiFetch } from '@/auth/client';

export interface ChecklistItem {
    id: string;
    area: string;
    text: string;
    done: boolean;
}

export interface Month {
    id: string;
    year: number;
    month: number;
    answers: Record<string, string>;
    items: ChecklistItem[];
}

export function useCloseoutMonth(id: string) {
    // undefined while loading, null when it does not exist.
    const [month, setMonth] = useState<Month | null | undefined>(undefined);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [itemError, setItemError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        apiFetch(`/api/closeout/${id}`)
            .then((res) => {
                if (res.status === 404) return null;
                return res.ok ? res.json() : Promise.reject();
            })
            .then((body: Month | null) => {
                if (!cancelled) setMonth(body);
            })
            .catch(() => {
                if (!cancelled) {
                    setMonth(null);
                    setError('Non riesco a caricare il mese.');
                }
            });
        return () => {
            cancelled = true;
        };
    }, [id]);

    /** Resolves to true once the month is gone. */
    const remove = async (): Promise<boolean> => {
        setBusy(true);
        setError(null);
        try {
            const res = await apiFetch(`/api/closeout/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok && res.status !== 404) throw new Error();
            return true;
        } catch {
            setError('Non riesco a eliminare il mese.');
            return false;
        } finally {
            setBusy(false);
        }
    };

    /**
     * Kept in local state before the request, so a field that unmounts and
     * mounts again (a tab switch) shows what was typed. Resolves to false
     * when the save failed.
     */
    const saveAnswer = async (key: string, value: string) => {
        setMonth((current) =>
            current
                ? { ...current, answers: { ...current.answers, [key]: value } }
                : current
        );
        try {
            const res = await apiFetch(`/api/closeout/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value }),
            });
            return res.ok;
        } catch {
            return false;
        }
    };

    const updateItems = (change: (items: ChecklistItem[]) => ChecklistItem[]) =>
        setMonth((current) =>
            current ? { ...current, items: change(current.items) } : current
        );

    const setDone = (itemId: string, done: boolean) =>
        updateItems((items) =>
            items.map((item) => (item.id === itemId ? { ...item, done } : item))
        );

    /** Ticks at once and rolls back if the save fails. */
    const toggleItem = async (item: ChecklistItem) => {
        setItemError(null);
        setDone(item.id, !item.done);
        try {
            const res = await apiFetch(`/api/closeout/${id}/items/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ done: !item.done }),
            });
            if (!res.ok) throw new Error();
        } catch {
            setDone(item.id, item.done);
            setItemError('Spunta non salvata.');
        }
    };

    /** Removes at once and puts the item back if the delete fails. */
    const removeItem = async (item: ChecklistItem) => {
        const index = month?.items.findIndex((i) => i.id === item.id) ?? -1;
        setItemError(null);
        updateItems((items) => items.filter((i) => i.id !== item.id));
        try {
            const res = await apiFetch(`/api/closeout/${id}/items/${item.id}`, {
                method: 'DELETE',
            });
            if (!res.ok && res.status !== 404) throw new Error();
        } catch {
            updateItems((items) => [
                ...items.slice(0, index),
                item,
                ...items.slice(index),
            ]);
            setItemError('Voce non eliminata.');
        }
    };

    /** Resolves to false when the item was not added. */
    const addItem = async (area: string, text: string) => {
        setItemError(null);
        try {
            const res = await apiFetch(`/api/closeout/${id}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ area, text }),
            });
            if (!res.ok) throw new Error();
            const item: ChecklistItem = await res.json();
            updateItems((items) => [...items, item]);
            return true;
        } catch {
            setItemError('Voce non aggiunta.');
            return false;
        }
    };

    return {
        month,
        busy,
        error,
        remove,
        saveAnswer,
        itemError,
        toggleItem,
        removeItem,
        addItem,
    };
}
