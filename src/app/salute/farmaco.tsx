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
import type { Medicine } from '@/hooks/use-health';
import { useFocusRing } from '@/hooks/use-focus-ring';
import { useTheme } from '@/hooks/use-theme';

/** Adds a medicine, or edits the one in `?id=`. */
export default function MedicinePage() {
    const theme = useTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const [name, setName] = useState('');
    const [frequency, setFrequency] = useState('');
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);
    const [loading, setLoading] = useState(Boolean(id));
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        apiFetch('/api/medicines')
            .then((res) => (res.ok ? res.json() : Promise.reject()))
            .then((lists: Record<'ongoing' | 'ended', Medicine[]>) => {
                if (cancelled) return;
                const found = [...lists.ongoing, ...lists.ended].find(
                    (m) => m.id === id
                );
                if (found) {
                    setName(found.name);
                    setFrequency(found.frequency ?? '');
                    setStartDate(found.startDate);
                    setEndDate(found.endDate);
                } else {
                    setError('Farmaco non trovato.');
                }
            })
            .catch(() => {
                if (!cancelled) setError('Non riesco a caricare il farmaco.');
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
            setError('Scrivi il nome del farmaco.');
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const res = await apiFetch(
                id ? `/api/medicines/${id}` : '/api/medicines',
                {
                    method: id ? 'PATCH' : 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({
                        name,
                        frequency,
                        startDate,
                        endDate,
                    }),
                }
            );
            if (res.ok) return backToList();
            const body = await res.json().catch(() => null);
            setError(
                body?.error === 'End before start'
                    ? 'La fine è prima dell’inizio.'
                    : 'Non riesco a salvare il farmaco.'
            );
        } catch {
            setError('Non riesco a salvare il farmaco.');
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        setConfirming(false);
        setBusy(true);
        setError(null);
        try {
            const res = await apiFetch(`/api/medicines/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) return backToList();
            setError('Non riesco a eliminare il farmaco.');
        } catch {
            setError('Non riesco a eliminare il farmaco.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader
                    title={id ? 'Farmaco' : 'Nuovo farmaco'}
                    backTo="/salute"
                />

                {loading ? (
                    <ActivityIndicator
                        color={theme.textMuted}
                        style={styles.loading}
                    />
                ) : (
                    <ScrollView contentContainerStyle={styles.body}>
                        <TextField
                            label="Nome"
                            value={name}
                            onChange={setName}
                            placeholder="Vitamina D"
                        />
                        <TextField
                            label="Frequenza"
                            value={frequency}
                            onChange={setFrequency}
                            placeholder="Una volta al giorno"
                        />
                        <View style={styles.fieldGroup}>
                            <ThemedText type="small" themeColor="textMuted">
                                Inizio
                            </ThemedText>
                            <DateField
                                value={startDate}
                                onChange={setStartDate}
                                label="Inizio"
                            />
                        </View>
                        <View style={styles.fieldGroup}>
                            <ThemedText type="small" themeColor="textMuted">
                                Fine
                            </ThemedText>
                            <DateField
                                value={endDate}
                                onChange={setEndDate}
                                label="Fine"
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

function TextField({
    label,
    value,
    onChange,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}) {
    const theme = useTheme();
    const focus = useFocusRing();

    return (
        <View style={styles.fieldGroup}>
            <ThemedText type="small" themeColor="textMuted">
                {label}
            </ThemedText>
            <TextInput
                value={value}
                onChangeText={onChange}
                onFocus={focus.onFocus}
                onBlur={focus.onBlur}
                placeholder={placeholder}
                placeholderTextColor={theme.textMuted}
                maxLength={200}
                accessibilityLabel={label}
                style={[
                    styles.input,
                    {
                        color: theme.text,
                        backgroundColor: theme.backgroundElement,
                    },
                    focus.ring,
                ]}
            />
        </View>
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
        // Matches the text line height so it lines up with the date fields.
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
