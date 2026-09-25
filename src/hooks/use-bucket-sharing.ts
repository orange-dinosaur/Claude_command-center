/**
 * Who the bucket list is shared with, and the invites that change it. Reloads
 * with the screen and the app, so an incoming invite shows up. `onLinked` runs
 * after accepting or unlinking, when the seasons have changed.
 */

import { useState } from 'react';

import { apiFetch } from '@/auth/client';
import { useOnFocus } from '@/hooks/use-on-focus';

export interface Sharing {
    partner: { name: string } | null;
    outgoing: { name: string; email: string } | null;
    incoming: { id: string; name: string }[];
}

const INVITE_ERRORS: Record<number, string> = {
    400: 'Questa è la tua email.',
    404: 'Nessun account con questa email.',
    409: 'Questa persona condivide già la sua bucket list.',
};

export function useBucketSharing(onLinked: () => void) {
    // undefined while loading the first time, null if that failed.
    const {
        data: sharing,
        error,
        setError,
        reload,
    } = useOnFocus<Sharing>(
        () =>
            apiFetch('/api/bucket/invite').then((res) =>
                res.ok ? res.json() : Promise.reject()
            ),
        'Non riesco a caricare la condivisione.'
    );
    const [busy, setBusy] = useState(false);

    /** Resolves to true on success; on failure sets `error` from the status. */
    const send = async (
        query: string,
        init: RequestInit,
        errors: Record<number, string> = {}
    ) => {
        setBusy(true);
        setError(null);
        try {
            const res = await apiFetch(`/api/bucket/invite${query}`, {
                ...init,
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) {
                setError(errors[res.status] ?? 'Qualcosa è andato storto.');
                return false;
            }
            reload();
            return true;
        } catch {
            setError('Qualcosa è andato storto.');
            return false;
        } finally {
            setBusy(false);
        }
    };

    const invite = (email: string) =>
        send(
            '',
            { method: 'POST', body: JSON.stringify({ email }) },
            INVITE_ERRORS
        );

    const cancel = () => send('', { method: 'DELETE' });

    const answer = async (id: string, accept: boolean) => {
        const ok = await send(`?action=${accept ? 'accept' : 'decline'}`, {
            method: 'POST',
            body: JSON.stringify({ id }),
        });
        if (ok && accept) onLinked();
        return ok;
    };

    const unlink = async () => {
        const ok = await send('?action=unlink', { method: 'POST' });
        if (ok) onLinked();
        return ok;
    };

    return {
        sharing,
        busy,
        error,
        clearError: () => setError(null),
        invite,
        cancel,
        answer,
        unlink,
    };
}
