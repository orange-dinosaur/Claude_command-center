import { useSyncExternalStore } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

export const DESKTOP_MIN_WIDTH = 900;

const subscribe = () => () => {};

/**
 * The server cannot know the window width, so it renders the phone layout and
 * hydration has to match that before switching to desktop.
 */
export function useIsDesktop(): boolean {
    const hydrated = useSyncExternalStore(
        subscribe,
        () => true,
        () => false
    );
    const { width } = useWindowDimensions();

    return Platform.OS === 'web' && hydrated && width >= DESKTOP_MIN_WIDTH;
}
