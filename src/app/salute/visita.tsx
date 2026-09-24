import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiFetch } from '@/auth/client';
import { DateField } from '@/components/date-field';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Checkup } from '@/hooks/use-health';
import { useFocusRing } from '@/hooks/use-focus-ring';
import { useTheme } from '@/hooks/use-theme';

/** Adds a check-up, or edits the one in `?id=`. */
export default function CheckupPage() {
    const theme = useTheme();
    const router = useRouter();
    const focus = useFocusRing();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const [name, setName] = useState('');
    const [lastDate, setLastDate] = useState<string | null>(null);
    const [loading, setLoading] = useState(Boolean(id));
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        apiFetch('/api/checkups')
            .then((res) => (res.ok ? res.json() : Promise.reject()))
            .then((checkups: Checkup[]) => {
                if (cancelled) return;
                const found = checkups.find((c) => c.id === id);
                if (found) {
                    setName(found.name);
                    setLastDate(found.lastDate);
                } else {
                    setError('Visita non trovata.');
                }
            })
            .catch(() => {
                if (!cancelled) setError('Non riesco a caricare la visita.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [id]);

    const backToList = () =>
        router.canGoBack() ? router.back() : router.replace('/salute');

    const save = async () => {
        if (!name.trim()) {
            setError('Scrivi il nome della visita.');
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const res = await apiFetch(
                id ? `/api/checkups/${id}` : '/api/checkups',
                {
                    method: id ? 'PATCH' : 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ name, lastDate }),
                }
            );
            if (res.ok) return backToList();
            setError(
                res.status === 409
                    ? 'Esiste già una visita con questo nome.'
                    : 'Non riesco a salvare la visita.'
            );
        } catch {
            setError('Non riesco a salvare la visita.');
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        setConfirming(false);
        setBusy(true);
        setError(null);
        try {
            const res = await apiFetch(`/api/checkups/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) return backToList();
            setError('Non riesco a eliminare la visita.');
        } catch {
            setError('Non riesco a eliminare la visita.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader
                    title={id ? 'Visita' : 'Nuova visita'}
                    backTo="/salute"
                />

                {loading ? (
                    <ActivityIndicator
                        color={theme.textMuted}
                        style={styles.loading}
                    />
                ) : (
                    <ScrollView contentContainerStyle={styles.body}>
                        <View style={styles.fieldGroup}>
                            <ThemedText type="small" themeColor="textMuted">
                                Visita
                            </ThemedText>
                            <TextInput
                                value={name}
                                onChangeText={setName}
                                onFocus={focus.onFocus}
                                onBlur={focus.onBlur}
                                placeholder="Dentista"
                                placeholderTextColor={theme.textMuted}
                                maxLength={200}
                                accessibilityLabel="Visita"
                                style={[
                                    styles.input,
                                    {
                                        color: theme.text,
                                        backgroundColor:
                                            theme.backgroundElement,
                                    },
                                    focus.ring,
                                ]}
                            />
                        </View>
                        <View style={styles.fieldGroup}>
                            <ThemedText type="small" themeColor="textMuted">
                                Ultima visita
                            </ThemedText>
                            <DateField
                                value={lastDate}
                                onChange={setLastDate}
                                label="Ultima visita"
                            />
                        </View>

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
                            onPress={save}
                            disabled={busy}
                            accessibilityRole="button"
                            style={({ pressed }) => [
                                styles.saveButton,
                                { backgroundColor: theme.accent },
                                pressed && styles.pressed,
                            ]}>
                            <ThemedText
                                style={[
                                    styles.buttonText,
                                    { color: theme.onAccent },
                                ]}>
                                Salva
                            </ThemedText>
                        </Pressable>
                        {id && (
                            <Pressable
                                onPress={() => setConfirming(true)}
                                disabled={busy}
                                accessibilityRole="button"
                                style={({ pressed }) => [
                                    styles.deleteButton,
                                    pressed && styles.pressed,
                                ]}>
                                <ThemedText themeColor="danger">
                                    Elimina
                                </ThemedText>
                            </Pressable>
                        )}
                    </ScrollView>
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
                            <ThemedText
                                type="subtitle"
                                style={styles.sheetTitle}>
                                Eliminare {name}?
                            </ThemedText>
                            <Pressable
                                onPress={remove}
                                accessibilityRole="button"
                                style={({ pressed }) => [
                                    styles.sheetButton,
                                    pressed && styles.pressed,
                                ]}>
                                <ThemedText themeColor="danger">
                                    Elimina
                                </ThemedText>
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
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loading: {
        paddingVertical: Spacing.three,
    },
    body: {
        flexGrow: 1,
        padding: Spacing.four,
        gap: Spacing.three,
    },
    fieldGroup: {
        gap: Spacing.one,
    },
    input: {
        fontSize: 16,
        // Matches the text line height so it lines up with the date field.
        lineHeight: 24,
        borderRadius: 12,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
    },
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
