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
}: FormActionsProps) {
    const theme = useTheme();
    const [confirming, setConfirming] = useState(false);

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
            {onDelete && (
                <Pressable
                    onPress={() => setConfirming(true)}
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
                visible={confirming}
                transparent
                animationType="fade"
                onRequestClose={() => setConfirming(false)}>
                <Pressable
                    style={styles.backdrop}
                    onPress={() => setConfirming(false)}>
                    <View
                        style={[
                            styles.sheet,
                            { backgroundColor: theme.backgroundElement },
                        ]}>
                        <ThemedText type="subtitle" style={styles.sheetTitle}>
                            Eliminare {name}?
                        </ThemedText>
                        <Pressable
                            onPress={() => {
                                setConfirming(false);
                                onDelete?.();
                            }}
                            accessibilityRole="button"
                            style={({ pressed }) => [
                                styles.sheetButton,
                                pressed && styles.pressed,
                            ]}>
                            <ThemedText themeColor="danger">Elimina</ThemedText>
                        </Pressable>
                        <Pressable
                            onPress={() => setConfirming(false)}
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
