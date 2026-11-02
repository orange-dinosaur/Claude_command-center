/**
 * What a page showed last time, kept on the device so it can show it at once.
 * `localStorage` is missing on the server page and can refuse a write, and
 * either way the page only waits for the server as it would without this.
 */

const NAMESPACE = 'saved.';
const OWNER = `${NAMESPACE}owner`;
// Raise the number when the shape of anything saved changes.
const PREFIX = `${NAMESPACE}1.`;

// What the server has confirmed since the app started.
const checked = new Set<string>();

export function readSaved<T>(name: string): T | undefined {
    try {
        const stored = localStorage.getItem(PREFIX + name);
        return stored === null ? undefined : JSON.parse(stored);
    } catch {
        return undefined;
    }
}

export function markChecked(name: string) {
    checked.add(name);
}

/** Saved data, only once the server has answered for it in this visit. */
export function readChecked<T>(name: string): T | undefined {
    return checked.has(name) ? readSaved<T>(name) : undefined;
}

export function writeSaved(name: string, value: unknown) {
    try {
        localStorage.setItem(PREFIX + name, JSON.stringify(value));
    } catch {}
}

export function removeSaved(name: string) {
    try {
        localStorage.removeItem(PREFIX + name);
    } catch {}
}

/**
 * Removes everything saved unless it belongs to this user. Null means signed
 * out, which always removes it.
 */
export function keepSavedFor(userId: string | null) {
    try {
        if (userId !== null && localStorage.getItem(OWNER) === userId) return;
        checked.clear();
        const keys = Array.from({ length: localStorage.length }, (_, i) =>
            localStorage.key(i)
        );
        for (const key of keys) {
            if (key?.startsWith(NAMESPACE)) localStorage.removeItem(key);
        }
        if (userId !== null) localStorage.setItem(OWNER, userId);
    } catch {}
}
