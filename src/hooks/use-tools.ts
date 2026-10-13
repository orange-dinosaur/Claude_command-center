/**
 * The signed-in user's tool order and hidden tools, shared by every screen.
 * The rail never loses focus, so a change made on the settings page reaches it
 * through this store rather than a reload on focus.
 */

import { useEffect, useMemo, useSyncExternalStore } from 'react';

import { apiFetch, authClient } from '@/auth/client';
import { arrange, type SavedTool } from '@/tools';

let saved: SavedTool[] | null = null;
let loadedFor: string | null = null;
const listeners = new Set<() => void>();

function set(next: SavedTool[] | null) {
    saved = next;
    listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

const read = () => saved;

/**
 * Saves the whole list and shows it at once. On failure the previous list
 * comes back and the result is false.
 */
// ponytail: quick flips send overlapping PUTs and the last to arrive wins;
// queue them if the saved order ever disagrees with the screen.
async function save(next: SavedTool[]): Promise<boolean> {
    const previous = saved;
    set(next);
    try {
        const res = await apiFetch('/api/settings/tools', {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ tools: next }),
        });
        if (res.ok) return true;
    } catch {}
    set(previous);
    return false;
}

/** Moves the tool at `from` to `to` and saves. */
function move(from: number, to: number): Promise<boolean> {
    const next = arrange(saved).map(({ key, hidden }) => ({ key, hidden }));
    next.splice(to, 0, ...next.splice(from, 1));
    return save(next);
}

export function useTools() {
    const { data: session } = authClient.useSession();
    const userId = session?.user.id ?? null;
    const current = useSyncExternalStore(subscribe, read, read);

    useEffect(() => {
        if (!userId || loadedFor === userId) return;
        loadedFor = userId;
        set(null);
        apiFetch('/api/settings/tools')
            .then((res) => (res.ok ? res.json() : Promise.reject()))
            .then((body: SavedTool[] | null) => {
                if (loadedFor === userId) set(body);
            })
            .catch(() => {
                // The code's order stays; the next screen to mount tries again.
                if (loadedFor === userId) loadedFor = null;
            });
    }, [userId]);

    // The code's order, all visible, until the saved list arrives.
    const tools = useMemo(() => arrange(current), [current]);
    return { tools, save, move };
}
