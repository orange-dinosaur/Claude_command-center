import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const subscribe = () => () => {};

/**
 * The server renders in light because it cannot know the device's setting, so
 * hydration has to match that before switching to the real scheme.
 */
export function useColorScheme(): 'light' | 'dark' {
    const hydrated = useSyncExternalStore(
        subscribe,
        () => true,
        () => false
    );
    const colorScheme = useRNColorScheme();

    return hydrated && colorScheme === 'dark' ? 'dark' : 'light';
}
