/**
 * The sheet that changes a glimmer's text, day and time, or deletes it.
 */

import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Sheet } from '@/components/sheet';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import {
    isFuture,
    MomentField,
    momentOf,
    toIso,
} from '@/glimmers/moment-field';
import { TEXT_MAX } from '@/glimmers/months';
import { useFocusRing } from '@/hooks/use-focus-ring';
import type { Glimmer } from '@/hooks/use-glimmers';
import { useTheme } from '@/hooks/use-theme';

interface GlimmerSheetProps {
    glimmer: Glimmer;
    onSave: (changes: Pick<Glimmer, 'text' | 'happenedAt'>) => void;
    onRemove: () => void;
    onClose: () => void;
}

export function GlimmerSheet({
    glimmer,
    onSave,
    onRemove,
    onClose,
}: GlimmerSheetProps) {
    const theme = useTheme();
    const focus = useFocusRing();
    const [text, setText] = useState(glimmer.text);
    const [moment, setMoment] = useState(() => momentOf(glimmer.happenedAt));
    const [confirming, setConfirming] = useState(false);
    const future = isFuture(moment);
    const valid = text.trim() !== '' && !future;

    const save = () => {
        if (!valid) return;
        const changed = {
            text: text.trim(),
            happenedAt: toIso(moment),
        };
        // Saving the same minute again would drop the seconds of a glimmer
        // written "now".
        const same =
            changed.text === glimmer.text &&
            JSON.stringify(moment) ===
                JSON.stringify(momentOf(glimmer.happenedAt));
        if (!same) onSave(changed);
        onClose();
    };

    return (
        <Sheet visible onClose={onClose} style={styles.sheet}>
            <TextInput
                multiline
                // Enter saves; a glimmer is one paragraph.
                blurOnSubmit
                value={text}
                onChangeText={(value) => setText(value.replace(/[\r\n]/g, ''))}
                onSubmitEditing={save}
                onFocus={focus.onFocus}
                onBlur={focus.onBlur}
                maxLength={TEXT_MAX}
                accessibilityLabel="Glimmer"
                style={[
                    styles.input,
                    { color: theme.text, backgroundColor: theme.background },
                    focus.ring,
                ]}
            />
            <MomentField value={moment} onChange={setMoment} />
            {future && (
                <ThemedText type="small" themeColor="danger">
                    Quel momento non è ancora arrivato.
                </ThemedText>
            )}
            <Pressable
                onPress={save}
                disabled={!valid}
                accessibilityRole="button"
                style={({ pressed }) => [
                    styles.save,
                    { backgroundColor: theme.accent },
                    !valid && styles.disabled,
                    pressed && styles.pressed,
                ]}>
                <ThemedText
                    style={[styles.saveText, { color: theme.onAccent }]}>
                    Salva
                </ThemedText>
            </Pressable>
            <View style={styles.remove}>
                {confirming ? (
                    <>
                        <ThemedText>Eliminare?</ThemedText>
                        <Pressable
                            onPress={() => {
                                onRemove();
                                onClose();
                            }}
                            accessibilityRole="button">
                            <ThemedText themeColor="danger">Sì</ThemedText>
                        </Pressable>
                        <Pressable
                            onPress={() => setConfirming(false)}
                            accessibilityRole="button">
                            <ThemedText>No</ThemedText>
                        </Pressable>
                    </>
                ) : (
                    <Pressable
                        onPress={() => setConfirming(true)}
                        accessibilityRole="button">
                        <ThemedText themeColor="danger">Elimina</ThemedText>
                    </Pressable>
                )}
            </View>
        </Sheet>
    );
}

const styles = StyleSheet.create({
    sheet: {
        gap: Spacing.three,
        padding: Spacing.four,
    },
    input: {
        fontSize: 16,
        lineHeight: 24,
        minHeight: 72,
        borderRadius: 12,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        textAlignVertical: 'top',
    },
    save: {
        paddingVertical: Spacing.three,
        borderRadius: 14,
        alignItems: 'center',
    },
    saveText: {
        fontFamily: 'Karla_600SemiBold',
        fontSize: 18,
        lineHeight: 24,
    },
    remove: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.three,
        padding: Spacing.two,
    },
    disabled: {
        opacity: 0.4,
    },
    pressed: {
        opacity: 0.6,
    },
});
