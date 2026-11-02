/**
 * Loads data whenever the screen comes into view, and again when the app or
 * browser tab comes back, so changes made elsewhere show up.
 */

import { useFocusEffect } from 'expo-router';
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { AppState } from 'react-native';

import { markChecked, readSaved, removeSaved, writeSaved } from '@/saved-data';

/**
 * `data` is undefined while loading the first time and null when there is
 * none or the first load failed. `key` says when `load` asks for something
 * else; `failure` is the message shown when loading fails. With `savedAs` the
 * page opens on what it showed last time on this device, until the server
 * answers.
 */
export function useOnFocus<T>(
    load: () => Promise<T | null>,
    failure: string,
    key?: string,
    savedAs?: string
) {
    const [data, setData] = useState<T | null | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);
    // Bumped by `reload` for pages that change the data without losing focus.
    const [version, setVersion] = useState(0);
    // Counts changes made by the page, so a load that started before one
    // does not overwrite it with what the server had then.
    const changes = useRef(0);
    const change = useCallback<typeof setData>((value) => {
        changes.current++;
        setData(value);
    }, []);
    const showingSaved = useRef(false);
    // Reset during render, so one item's data is never saved under another's
    // name.
    const [dataOf, setDataOf] = useState(savedAs);
    if (dataOf !== savedAs) {
        setDataOf(savedAs);
        setData(undefined);
    }

    // After mount, so the first render matches the server's page.
    useLayoutEffect(() => {
        const stored = savedAs ? readSaved<T>(savedAs) : undefined;
        showingSaved.current = stored !== undefined;
        if (stored === undefined) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setData((current) => (current === undefined ? stored : current));
    }, [savedAs]);

    useEffect(() => {
        if (!savedAs || data === undefined) return;
        if (data === null) removeSaved(savedAs);
        else writeSaved(savedAs, data);
    }, [savedAs, data]);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            const started = changes.current;
            load()
                .then((result) => {
                    if (cancelled) return;
                    const fresh = changes.current === started;
                    setData((current) =>
                        current === undefined || fresh ? result : current
                    );
                    if (fresh) {
                        // A dropped load leaves the page's message alone.
                        setError(null);
                        if (savedAs) markChecked(savedAs);
                        // A tap on saved rows dropped this load, so the rest of
                        // the page is still old. ponytail: if the tap's save
                        // has not landed, this load can undo it on screen until
                        // next focus.
                    } else if (showingSaved.current) setVersion((v) => v + 1);
                    showingSaved.current = false;
                })
                .catch(() => {
                    if (cancelled) return;
                    setData((current) => current ?? null);
                    setError(failure);
                });
            return () => {
                cancelled = true;
            };
            // load is a new closure each render; key says when it changes, and
            // version is listed only so that reload() fetches again.
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [key, version])
    );

    const reload = useCallback(() => setVersion((v) => v + 1), []);

    // On web AppState follows the tab's visibility.
    useEffect(() => {
        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'active') reload();
        });
        return () => sub.remove();
    }, [reload]);

    return { data, setData: change, error, setError, reload };
}
