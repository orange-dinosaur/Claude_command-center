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
import type { Checkup } from '@/hooks/use-health';
import { useTheme } from '@/hooks/use-theme';

/** Adds a check-up, or edits the one in `?id=`. */
export default function CheckupPage() {
    const theme = useTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const [name, setName] = useState('');
    const [lastDate, setLastDate] = useState<string | null>(null);
    const [loading, setLoading] = useState(Boolean(id));
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                        <TextField
                            label="Visita"
                            value={name}
                            onChange={setName}
                            placeholder="Dentista"
                        />
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
