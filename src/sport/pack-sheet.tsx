/**
 * The sheet that records a lesson pack, or changes or deletes one.
 */

import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { apiFetch } from '@/auth/client';
import { DateField } from '@/components/date-field';
import { Sheet } from '@/components/sheet';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { todayDay } from '@/dates';
import type { LessonPack } from '@/hooks/use-lessons';
import { useTheme } from '@/hooks/use-theme';
import { formatEuros, parseEuros } from '@/sport/lessons';

export function PackSheet({
    activityId,
    pack,
    onSaved,
    onClose,
}: {
    activityId: string;
    /** The pack to change; without it the sheet records a new one. */
    pack?: LessonPack;
    /** Called after a save or a delete. */
    onSaved: () => void;
    onClose: () => void;
}) {
    const theme = useTheme();
    const [lessons, setLessons] = useState(String(pack?.lessons ?? 6));
    const [paidOn, setPaidOn] = useState(pack?.paidOn ?? todayDay());
    const [amount, setAmount] = useState(
        pack ? formatEuros(pack.amountCents).replace(' €', '') : ''
    );
    const [confirming, setConfirming] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const send = async (method: 'POST' | 'PATCH' | 'DELETE', body?: object) => {
        setBusy(true);
        setError(null);
        try {
            const res = await apiFetch(
                pack ? `/api/lesson-packs/${pack.id}` : '/api/lesson-packs',
                {
                    method,
                    headers: { 'content-type': 'application/json' },
                    body: body && JSON.stringify(body),
                }
            );
            if (!res.ok) throw new Error();
            onSaved();
            onClose();
        } catch {
            setError(
                method === 'DELETE'
                    ? 'Non riesco a eliminare il pacchetto.'
                    : 'Non riesco a salvare il pacchetto.'
            );
        } finally {
            setBusy(false);
        }
    };

    const save = () => {
        const count = Number(lessons.trim());
        if (!Number.isInteger(count) || count < 1 || count > 100) {
            setError('Le lezioni vanno da 1 a 100.');
            return;
        }
        const amountCents = parseEuros(amount);
        if (amountCents === undefined) {
            setError('Scrivi l’importo in euro, come 90 o 92,50.');
            return;
        }
        const fields = { lessons: count, paidOn, amountCents };
        send(
            pack ? 'PATCH' : 'POST',
            pack ? fields : { activityId, ...fields }
        );
    };

    return (
        <Sheet visible onClose={onClose} style={styles.sheet}>
            <ThemedText type="subtitle">
                {pack ? 'Pacchetto' : 'Nuovo pacchetto'}
            </ThemedText>
            <TextField
                label="Lezioni"
                value={lessons}
                onChange={setLessons}
                placeholder="6"
                keyboardType="number-pad"
            />
            <View style={styles.fieldGroup}>
                <ThemedText type="small" themeColor="textMuted">
                    Pagato il
                </ThemedText>
                <DateField
                    value={paidOn}
                    onChange={(day) => day && setPaidOn(day)}
                    label="Pagato il"
                    pastOnly
                />
            </View>
            <TextField
                label="Importo in euro"
                value={amount}
                onChange={setAmount}
                placeholder="90"
                keyboardType="decimal-pad"
            />
            {error && (
                <ThemedText type="small" themeColor="danger">
                    {error}
                </ThemedText>
            )}
            <Pressable
                onPress={save}
                disabled={busy}
                accessibilityRole="button"
                style={({ pressed }) => [
                    styles.save,
                    { backgroundColor: theme.accent },
                    (pressed || busy) && styles.pressed,
                ]}>
                <ThemedText
                    style={[styles.saveText, { color: theme.onAccent }]}>
                    Salva
                </ThemedText>
            </Pressable>
            {pack && (
                <View style={styles.remove}>
                    {confirming ? (
                        <>
                            <ThemedText>Eliminare?</ThemedText>
                            <Pressable
                                onPress={() => send('DELETE')}
                                disabled={busy}
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
            )}
        </Sheet>
    );
}

const styles = StyleSheet.create({
    sheet: {
        gap: Spacing.three,
        padding: Spacing.four,
    },
    fieldGroup: {
        gap: Spacing.one,
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
    pressed: {
        opacity: 0.6,
    },
});
