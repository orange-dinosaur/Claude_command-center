/**
 * The signed-in user's tool order and hidden tools, shared by every screen.
 * The rail never loses focus, so a change made on the settings page reaches it
 * through this store rather than a reload on focus.
 */

import { useEffect, useMemo, useSyncExternalStore } from 'react';

import { apiFetch, authClient } from '@/auth/client';
import { arrange, type SavedTool } from '@/tools';

const STORAGE_KEY = 'tools.saved';

let saved: SavedTool[] | null = null;
// The user `saved` belongs to. The device remembers the list between visits,
// so it shows before the session is known.
let owner: string | null = null;
let loadedFor: string | null = null;
const listeners = new Set<() => void>();

try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (stored) {
        saved = stored.tools;
        owner = stored.userId;
    }
} catch {}

function set(next: SavedTool[] | null) {
    saved = next;
    try {
        if (next && owner) {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ userId: owner, tools: next })
            );
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    } catch {}
    listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

const read = () => saved;

// The server cannot know the user's tools, so its page has none. Compared by
// identity: an empty saved list would still mean every tool.
const ON_SERVER: SavedTool[] = [];
const readOnServer = () => ON_SERVER;

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
    const { data: session, isPending } = authClient.useSession();
    const userId = session?.user.id ?? null;
    const current = useSyncExternalStore(subscribe, read, readOnServer);
    const ready = current !== ON_SERVER;

    useEffect(() => {
        if (isPending) return;
        // Signed out, or someone else signed in: the list is not theirs.
        if (owner !== userId) {
            owner = userId;
            loadedFor = null;
            set(null);
        }
        if (!userId || loadedFor === userId) return;
        loadedFor = userId;
        apiFetch('/api/settings/tools')
            .then((res) => (res.ok ? res.json() : Promise.reject()))
            .then((body: SavedTool[] | null) => {
                if (loadedFor === userId) set(body);
            })
            .catch(() => {
                // The code's order stays; the next screen to mount tries again.
                if (loadedFor === userId) loadedFor = null;
            });
    }, [isPending, userId]);

    // The code's order, all visible, until a list is remembered or arrives.
    const tools = useMemo(
        () => (ready ? arrange(current) : []),
        [ready, current]
    );
    return { tools, ready, save, move };
}
