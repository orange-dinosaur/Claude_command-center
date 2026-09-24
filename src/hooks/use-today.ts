import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

const formatter = new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
});

function subscribe(onChange: () => void) {
    const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') onChange();
    });
    return () => subscription.remove();
}

/**
 * Today's date as "giovedì 24 settembre", re-read whenever the app comes back
 * to the foreground. Empty on the server, which runs in UTC and could be a day
 * off from the phone.
 */
export function useToday(): string {
    return useSyncExternalStore(
        subscribe,
        () => formatter.format(new Date()),
        () => ''
    );
}
