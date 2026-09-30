import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    View,
    type StyleProp,
    type ViewStyle,
} from 'react-native';

import { apiFetch } from '@/auth/client';
import { DateField } from '@/components/date-field';
import { FormActions } from '@/components/form-actions';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { Checkup } from '@/hooks/use-health';
import { useTheme } from '@/hooks/use-theme';

export interface HealthFormProps<T> {
    /** The record to edit; without it the form adds a new one. */
    id?: string;
    /** Shown above the fields when the page has no header of its own. */
    title?: string;
    onSaved: (saved: T) => void;
    onDeleted: () => void;
    style?: StyleProp<ViewStyle>;
}

/** Adds a check-up, or edits the one with `id`. */
export function CheckupForm({
    id,
    title,
    onSaved,
    onDeleted,
    style,
}: HealthFormProps<Checkup>) {
    const theme = useTheme();
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
            if (res.ok) return onSaved(await res.json());
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
            if (res.ok) return onDeleted();
            setError('Non riesco a eliminare la visita.');
        } catch {
            setError('Non riesco a eliminare la visita.');
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <ActivityIndicator color={theme.textMuted} style={styles.loading} />
        );
    }

    return (
        <ScrollView contentContainerStyle={[styles.body, style]}>
            {title && <ThemedText type="title">{title}</ThemedText>}
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
    );
}

const styles = StyleSheet.create({
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
