import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Sheet } from './sheet';
import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useTheme } from '@/hooks/use-theme';

interface FormActionsProps {
    error: string | null;
    busy: boolean;
    onSave: () => void;
    /** Leave out on a new record: there is nothing to delete yet. */
    onDelete?: () => void;
    /** Shown in the confirmation, "Eliminare {name}?". */
    name: string;
    /** Another destructive action above "Elimina", confirmed the same way. */
    extra?: { label: string; question: string; onConfirm: () => void };
    /** On the phone, one row and less space above it, for a form that must fit the screen. */
    compact?: boolean;
}

/**
 * The bottom of an add or edit page: the error, "Salva", and an "Elimina"
 * link that asks in a sheet first. Place it last in a growing scroll view so
 * it sits at the bottom.
 */
export function FormActions({
    error,
    busy,
    onSave,
    onDelete,
    name,
    extra,
    compact = false,
}: FormActionsProps) {
    const theme = useTheme();
    const isDesktop = useIsDesktop();
    const phoneRow = compact && !isDesktop;
    const [confirming, setConfirming] = useState<'delete' | 'extra' | null>(
        null
    );
    const sheet =
        confirming === 'extra' && extra
            ? {
                  question: extra.question,
                  label: extra.label,
                  run: extra.onConfirm,
              }
            : {
                  question: `Eliminare ${name}?`,
                  label: 'Elimina',
                  run: onDelete,
              };

    return (
        <>
            {!isDesktop && (
                <View
                    style={[styles.spacer, phoneRow && styles.spacerCompact]}
                />
            )}

            {error && (
                <ThemedText
                    type="small"
                    themeColor="danger"
                    style={!isDesktop && styles.center}>
                    {error}
                </ThemedText>
            )}
            <View
                style={
                    isDesktop
                        ? styles.row
                        : phoneRow
                          ? styles.phoneRow
                          : styles.column
                }>
                <Pressable
                    onPress={onSave}
                    disabled={busy}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                        styles.saveButton,
                        isDesktop && styles.saveDesktop,
                        phoneRow && styles.grow,
                        { backgroundColor: theme.accent },
                        pressed && styles.pressed,
                    ]}>
                    <ThemedText
                        style={[styles.buttonText, { color: theme.onAccent }]}>
                        Salva
                    </ThemedText>
                </Pressable>
                {extra && (
                    <Pressable
                        onPress={() => setConfirming('extra')}
                        disabled={busy}
                        accessibilityRole="button"
                        style={({ pressed }) => [
                            styles.deleteButton,
                            isDesktop && styles.link,
                            pressed && styles.pressed,
                        ]}>
                        <ThemedText themeColor="danger">
                            {extra.label}
                        </ThemedText>
                    </Pressable>
                )}
                {onDelete && (
                    <Pressable
                        onPress={() => setConfirming('delete')}
                        disabled={busy}
                        accessibilityRole="button"
                        style={({ pressed }) => [
                            styles.deleteButton,
                            isDesktop && styles.link,
                            pressed && styles.pressed,
                        ]}>
                        <ThemedText themeColor="danger">Elimina</ThemedText>
                    </Pressable>
                )}
            </View>

            <Sheet
                visible={confirming !== null}
                onClose={() => setConfirming(null)}>
                <ThemedText type="subtitle" style={styles.sheetTitle}>
                    {sheet.question}
                </ThemedText>
                <Pressable
                    onPress={() => {
                        setConfirming(null);
                        sheet.run?.();
                    }}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                        styles.sheetButton,
                        pressed && styles.pressed,
                    ]}>
                    <ThemedText themeColor="danger">{sheet.label}</ThemedText>
                </Pressable>
                <Pressable
                    onPress={() => setConfirming(null)}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                        styles.sheetButton,
                        {
                            borderTopWidth: 1,
                            borderTopColor: theme.border,
                        },
                        pressed && styles.pressed,
                    ]}>
                    <ThemedText>Annulla</ThemedText>
                </Pressable>
            </Sheet>
        </>
    );
}

const styles = StyleSheet.create({
    spacer: {
        flex: 1,
        minHeight: Spacing.six,
    },
    spacerCompact: {
        minHeight: Spacing.two,
    },
    center: {
        textAlign: 'center',
    },
    saveButton: {
        paddingVertical: Spacing.three,
        borderRadius: 14,
        alignItems: 'center',
    },
    buttonText: {
        fontFamily: 'Karla_600SemiBold',
        fontSize: 18,
        lineHeight: 24,
    },
    deleteButton: {
        alignSelf: 'center',
        padding: Spacing.three,
    },
    // Same gap as the form bodies these actions end.
    column: {
        gap: Spacing.three,
    },
    // On desktop "Salva" and the links sit in one row, as in the detail panel.
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.four,
        paddingTop: Spacing.five,
    },
    saveDesktop: {
        paddingHorizontal: 48,
    },
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
    },
    grow: {
        flex: 1,
    },
    link: {
        padding: 0,
    },
    pressed: {
        opacity: 0.6,
    },
    sheetTitle: {
        textAlign: 'center',
        paddingTop: Spacing.three,
        paddingBottom: Spacing.one,
    },
    sheetButton: {
        alignItems: 'center',
        paddingVertical: Spacing.three,
    },
});
