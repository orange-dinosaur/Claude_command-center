import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
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
}: FormActionsProps) {
    const theme = useTheme();
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
            <View style={styles.spacer} />

            {error && (
                <ThemedText
                    type="small"
                    themeColor="danger"
                    style={styles.center}>
                    {error}
                </ThemedText>
            )}
            <Pressable
                onPress={onSave}
                disabled={busy}
                accessibilityRole="button"
                style={({ pressed }) => [
                    styles.saveButton,
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
                        pressed && styles.pressed,
                    ]}>
                    <ThemedText themeColor="danger">{extra.label}</ThemedText>
                </Pressable>
            )}
            {onDelete && (
                <Pressable
                    onPress={() => setConfirming('delete')}
                    disabled={busy}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                        styles.deleteButton,
                        pressed && styles.pressed,
                    ]}>
                    <ThemedText themeColor="danger">Elimina</ThemedText>
                </Pressable>
            )}

            <Modal
                visible={confirming !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setConfirming(null)}>
                <Pressable
                    style={styles.backdrop}
                    onPress={() => setConfirming(null)}>
                    <View
                        style={[
                            styles.sheet,
                            { backgroundColor: theme.backgroundElement },
                        ]}>
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
                            <ThemedText themeColor="danger">
                                {sheet.label}
                            </ThemedText>
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
                    </View>
                </Pressable>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    spacer: {
        flex: 1,
        minHeight: Spacing.six,
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
    pressed: {
        opacity: 0.6,
    },
    backdrop: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        padding: Spacing.three,
    },
    sheet: {
        borderRadius: 20,
        paddingVertical: Spacing.two,
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
