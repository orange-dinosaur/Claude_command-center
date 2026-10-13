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
    // A window left open and visible overnight never changes state.
    let timer: ReturnType<typeof setTimeout>;
    const atMidnight = () => {
        const now = new Date();
        const next = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1
        );
        timer = setTimeout(() => {
            onChange();
            atMidnight();
        }, next.getTime() - now.getTime());
    };
    atMidnight();
    return () => {
        subscription.remove();
        clearTimeout(timer);
    };
}

/**
 * Today's date as "giovedì 24 settembre", re-read at midnight and whenever the
 * app comes back to the foreground. Empty on the server, which runs in UTC and could be a day
 * off from the phone.
 */
export function useToday(): string {
    return useSyncExternalStore(
        subscribe,
        () => formatter.format(new Date()),
        () => ''
    );
}
