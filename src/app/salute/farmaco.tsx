import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiFetch } from '@/auth/client';
import { DateField } from '@/components/date-field';
import { FormActions } from '@/components/form-actions';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Medicine } from '@/hooks/use-health';
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

                        <FormActions
                            error={error}
                            busy={busy}
                            onSave={save}
                            onDelete={id ? remove : undefined}
                            name={name}
                        />
                    </ScrollView>
                )}
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
});
