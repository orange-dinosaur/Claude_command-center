import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { Colors, SCHEME_KEY } from '@/constants/theme';

type Scheme = 'light' | 'dark';

const listeners = new Set<() => void>();
let stored: Scheme | null = null;
try {
    const value = localStorage.getItem(SCHEME_KEY);
    if (value === 'light' || value === 'dark') stored = value;
} catch {}

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};
const noop = () => () => {};

/** Saves the choice and repaints the page in it; the device setting stops applying. */
export function setColorScheme(scheme: Scheme) {
    stored = scheme;
    try {
        localStorage.setItem(SCHEME_KEY, scheme);
    } catch {}
    document.documentElement.dataset.scheme = scheme;
    // The iPhone status bar follows these, as set on load in +html.tsx.
    document
        .querySelectorAll('meta[name="theme-color"]')
        .forEach((meta) =>
            meta.setAttribute('content', Colors[scheme].background)
        );
    listeners.forEach((listener) => listener());
}

/**
 * The server renders in light because it cannot know the device's setting or
 * the stored choice, so hydration has to match that before switching.
 */
export function useColorScheme(): Scheme {
    const hydrated = useSyncExternalStore(
        noop,
        () => true,
        () => false
    );
    const choice = useSyncExternalStore(
        subscribe,
        () => stored,
        () => null
    );
    const colorScheme = useRNColorScheme();

    if (!hydrated) return 'light';
    return choice ?? (colorScheme === 'dark' ? 'dark' : 'light');
}
