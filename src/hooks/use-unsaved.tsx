/**
 * Which text fields of a page failed to save. While any has, closing or
 * reloading the tab asks the browser to confirm, and the app's back arrow
 * asks in a sheet. Render `sheet` in the page.
 */

import { useNavigation } from 'expo-router';
import {
    usePreventRemove,
    type NavigationAction,
} from 'expo-router/react-navigation';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { Sheet } from '@/components/sheet';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type Unsaved = ReturnType<typeof useUnsaved>;

export function useUnsaved() {
    const theme = useTheme();
    const navigation = useNavigation();
    const [keys, setKeys] = useState<ReadonlySet<string>>(new Set());
    const [leaving, setLeaving] = useState<NavigationAction | null>(null);
    const dirty = keys.size > 0;

    const mark = useCallback(
        (key: string, unsaved: boolean) =>
            setKeys((current) => {
                if (current.has(key) === unsaved) return current;
                const next = new Set(current);
                if (unsaved) next.add(key);
                else next.delete(key);
                return next;
            }),
        []
    );

    useEffect(() => {
        if (!dirty || Platform.OS !== 'web') return;
        const warn = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            // Older Safari asks only when this is set.
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [dirty]);

    usePreventRemove(dirty, ({ data }) => setLeaving(data.action));

    const sheet = (
        <Sheet visible={leaving !== null} onClose={() => setLeaving(null)}>
            <ThemedText type="subtitle" style={styles.title}>
                Uscire senza salvare?
            </ThemedText>
            <Pressable
                onPress={() => {
                    if (leaving) navigation.dispatch(leaving);
                    setLeaving(null);
                }}
                accessibilityRole="button"
                style={({ pressed }) => [
                    styles.button,
                    pressed && styles.pressed,
                ]}>
                <ThemedText themeColor="danger">Esci</ThemedText>
            </Pressable>
            <Pressable
                onPress={() => setLeaving(null)}
                accessibilityRole="button"
                style={({ pressed }) => [
                    styles.button,
                    { borderTopWidth: 1, borderTopColor: theme.border },
                    pressed && styles.pressed,
                ]}>
                <ThemedText>Annulla</ThemedText>
            </Pressable>
        </Sheet>
    );

    return { isUnsaved: (key: string) => keys.has(key), mark, sheet };
}

const styles = StyleSheet.create({
    title: {
        textAlign: 'center',
        paddingTop: Spacing.three,
        paddingBottom: Spacing.one,
    },
    button: {
        alignItems: 'center',
        paddingVertical: Spacing.three,
    },
    pressed: {
        opacity: 0.6,
    },
});
