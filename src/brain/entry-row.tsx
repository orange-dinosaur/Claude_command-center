/**
 * One brain dump entry. A tap turns it into a field in place: Enter or a tap
 * outside saves, Esc cancels, and "Elimina" asks before deleting.
 */

import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { formatTime, TEXT_MAX } from '@/brain/days';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { Entry } from '@/hooks/use-brain';
import { useFocusRing } from '@/hooks/use-focus-ring';
import { useTheme } from '@/hooks/use-theme';

// A press starts after the field has blurred, and the blur would close the
// row before "Elimina" is pressed. Cancelling mousedown keeps the focus.
const keepFocus = {
    onMouseDown: (e: { preventDefault: () => void }) => e.preventDefault(),
} as object;

interface EntryRowProps {
    entry: Entry;
    onEdit: (text: string) => void;
    onRemove: () => void;
}

export function EntryRow({ entry, onEdit, onRemove }: EntryRowProps) {
    const theme = useTheme();
    const focus = useFocusRing();
    const [draft, setDraft] = useState<string | null>(null);
    const [confirming, setConfirming] = useState(false);
    // Enter blurs the field too; only the first of the two counts.
    const open = useRef(false);

    const start = () => {
        open.current = true;
        setDraft(entry.text);
    };

    const finish = (save: boolean) => {
        if (!open.current) return;
        open.current = false;
        const text = draft?.trim();
        if (save && text && text !== entry.text) onEdit(text);
        setDraft(null);
        setConfirming(false);
    };

    const time = (
        <ThemedText type="small" themeColor="textMuted">
            {formatTime(entry.createdAt)}
        </ThemedText>
    );

    if (draft === null) {
        return (
            <Pressable
                onPress={start}
                // Not saved yet, so there is nothing to change on the server.
                disabled={entry.id.startsWith('new-')}
                accessibilityRole="button"
                accessibilityHint="Modifica"
                style={({ pressed }) => [
                    styles.row,
                    pressed && styles.pressed,
                ]}>
                <ThemedText>•</ThemedText>
                <ThemedText style={styles.grow}>{entry.text}</ThemedText>
                {time}
            </Pressable>
        );
    }

    return (
        <View style={styles.editing}>
            <TextInput
                autoFocus
                multiline
                // Enter saves instead of starting a new line.
                blurOnSubmit
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={() => finish(true)}
                onFocus={focus.onFocus}
                onBlur={() => {
                    focus.onBlur();
                    finish(true);
                }}
                onKeyPress={(e) => {
                    if (e.nativeEvent.key === 'Escape') finish(false);
                }}
                maxLength={TEXT_MAX}
                accessibilityLabel="Voce"
                style={[
                    styles.input,
                    {
                        color: theme.text,
                        backgroundColor: theme.backgroundElement,
                    },
                    focus.ring,
                ]}
            />
            <View style={styles.actions} {...keepFocus}>
                {time}
                <View style={styles.grow} />
                {confirming ? (
                    <>
                        <ThemedText type="small">Eliminare?</ThemedText>
                        <Pressable
                            onPress={() => {
                                open.current = false;
                                onRemove();
                            }}
                            accessibilityRole="button">
                            <ThemedText type="small" themeColor="danger">
                                Sì
                            </ThemedText>
                        </Pressable>
                        <Pressable
                            onPress={() => setConfirming(false)}
                            accessibilityRole="button">
                            <ThemedText type="small">No</ThemedText>
                        </Pressable>
                    </>
                ) : (
                    <Pressable
                        onPress={() => setConfirming(true)}
                        accessibilityRole="button">
                        <ThemedText type="small" themeColor="danger">
                            Elimina
                        </ThemedText>
                    </Pressable>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: Spacing.two,
    },
    pressed: {
        opacity: 0.6,
    },
    grow: {
        flex: 1,
    },
    editing: {
        gap: Spacing.one,
    },
    input: {
        fontSize: 16,
        lineHeight: 24,
        minHeight: 48,
        borderRadius: 12,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: Spacing.three,
        paddingHorizontal: Spacing.three,
    },
});
