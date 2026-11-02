/**
 * What a page showed last time, kept on the device so it can show it at once.
 * `localStorage` is missing on the server page and can refuse a write, and
 * either way the page only waits for the server as it would without this.
 */

// Raise the number when the shape of anything saved changes.
const PREFIX = 'saved.1.';

export function readSaved<T>(name: string): T | undefined {
    try {
        const stored = localStorage.getItem(PREFIX + name);
        return stored === null ? undefined : JSON.parse(stored);
    } catch {
        return undefined;
    }
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
