import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
    type StyleProp,
    type ViewStyle,
} from 'react-native';

import { apiFetch } from '@/auth/client';
import { DateField } from '@/components/date-field';
import { FormActions } from '@/components/form-actions';
import { Switch } from '@/components/switch';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { todayDay } from '@/dates';
import {
    useWorkoutTypes,
    type Workout,
    type WorkoutType,
} from '@/hooks/use-sport';
import { useTheme } from '@/hooks/use-theme';

/** Records a workout, or edits the one with `id`. */
export function WorkoutForm({
    id,
    initialDate,
    initialTypeId,
    initialLesson = false,
    title,
    onSaved,
    onDeleted,
    style,
}: {
    /** The workout to edit; without it the form records a new one. */
    id?: string;
    /** A new workout's day, from a link; anything but `YYYY-MM-DD` means today. */
    initialDate?: string;
    /** A new workout's type and lesson mark, from "Ho fatto una lezione". */
    initialTypeId?: string;
    initialLesson?: boolean;
    /** Shown above the fields when the page has no header of its own. */
    title?: string;
    onSaved: (saved: Workout) => void;
    onDeleted: () => void;
    style?: StyleProp<ViewStyle>;
}) {
    const theme = useTheme();
    const { types, setTypes, error: typesError } = useWorkoutTypes();
    const [typeId, setTypeId] = useState<string | null>(initialTypeId ?? null);
    const [date, setDate] = useState(
        initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)
            ? initialDate
            : todayDay()
    );
    const [minutes, setMinutes] = useState('');
    const [note, setNote] = useState('');
    const [lesson, setLesson] = useState(initialLesson);
    // The saved type, so an edit that keeps it leaves the lesson mark alone.
    const [savedTypeId, setSavedTypeId] = useState<string | null>(null);
    const [loading, setLoading] = useState(Boolean(id));
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        apiFetch('/api/workouts')
            .then((res) => (res.ok ? res.json() : Promise.reject()))
            .then((workouts: Workout[]) => {
                if (cancelled) return;
                const found = workouts.find((w) => w.id === id);
                if (found) {
                    setTypeId(found.typeId);
                    setSavedTypeId(found.typeId);
                    setLesson(found.lesson);
                    setDate(found.date);
                    setMinutes(found.minutes?.toString() ?? '');
                    setNote(found.note ?? '');
                } else {
                    setError('Allenamento non trovato.');
                }
            })
            .catch(() => {
                if (!cancelled)
                    setError('Non riesco a caricare l’allenamento.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [id]);

    const markable = (type?: WorkoutType) =>
        !!type?.activity && !type.activity.archived;
    const canMark = markable(types?.find((t) => t.id === typeId));

    const save = async () => {
        if (!typeId) {
            setError('Scegli un tipo.');
            return;
        }
        const trimmed = minutes.trim();
        const parsed = trimmed ? Number(trimmed) : null;
        if (
            parsed !== null &&
            (!Number.isInteger(parsed) || parsed < 1 || parsed > 600)
        ) {
            setError('La durata va da 1 a 600 minuti.');
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const res = await apiFetch(
                id ? `/api/workouts/${id}` : '/api/workouts',
                {
                    method: id ? 'PATCH' : 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({
                        typeId,
                        date,
                        minutes: parsed,
                        note: note.trim() || null,
                        // Hidden switch: an archived activity keeps its old
                        // lessons, a new type drops the mark.
                        lesson: canMark
                            ? lesson
                            : typeId === savedTypeId
                              ? undefined
                              : false,
                    }),
                }
            );
            if (res.ok) {
                // The API returns only the type's id; the name comes from
                // the types already loaded for the picker.
                const saved: Omit<Workout, 'typeName'> = await res.json();
                return onSaved({
                    ...saved,
                    typeName:
                        types?.find((t) => t.id === saved.typeId)?.name ?? '',
                });
            }
            setError('Non riesco a salvare l’allenamento.');
        } catch {
            setError('Non riesco a salvare l’allenamento.');
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        setBusy(true);
        setError(null);
        try {
            const res = await apiFetch(`/api/workouts/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) return onDeleted();
            setError('Non riesco a eliminare l’allenamento.');
        } catch {
            setError('Non riesco a eliminare l’allenamento.');
        } finally {
            setBusy(false);
        }
    };

    if (loading || types === undefined) {
        return (
            <ActivityIndicator color={theme.textMuted} style={styles.loading} />
        );
    }

    return (
        <ScrollView contentContainerStyle={[styles.body, style]}>
            {title && <ThemedText type="title">{title}</ThemedText>}
            <View style={styles.fieldGroup}>
                <ThemedText type="small" themeColor="textMuted">
                    Tipo
                </ThemedText>
                {typesError && (
                    <ThemedText type="small" themeColor="danger">
                        {typesError}
                    </ThemedText>
                )}
                <View style={styles.chips}>
                    {types.map((t) => {
                        const selected = t.id === typeId;
                        return (
                            <Pressable
                                key={t.id}
                                onPress={() => {
                                    setTypeId(t.id);
                                    if (!markable(t)) setLesson(false);
                                }}
                                accessibilityRole="button"
                                accessibilityState={{ selected }}
                                style={[
                                    styles.chip,
                                    {
                                        backgroundColor: selected
                                            ? theme.accent
                                            : theme.backgroundElement,
                                    },
                                ]}>
                                <ThemedText
                                    style={
                                        selected && { color: theme.onAccent }
                                    }>
                                    {t.name}
                                </ThemedText>
                            </Pressable>
                        );
                    })}
                    <NewType
                        onCreated={(type) => {
                            setTypes((current) => [...(current ?? []), type]);
                            setTypeId(type.id);
                        }}
                    />
                </View>
            </View>

            {canMark && (
                <View style={styles.switchRow}>
                    <ThemedText style={styles.grow}>
                        Lezione del pacchetto
                    </ThemedText>
                    <Switch
                        value={lesson}
                        onValueChange={setLesson}
                        accessibilityLabel="Lezione del pacchetto"
                    />
                </View>
            )}

            <View style={styles.fieldGroup}>
                <ThemedText type="small" themeColor="textMuted">
                    Data
                </ThemedText>
                <DateField
                    value={date}
                    onChange={(day) => day && setDate(day)}
                    label="Data"
                    pastOnly
                />
            </View>
            <TextField
                label="Durata in minuti"
                value={minutes}
                onChange={setMinutes}
                placeholder="45"
                keyboardType="number-pad"
            />
            <TextField
                label="Nota"
                value={note}
                onChange={setNote}
                placeholder="5 km, gambe pesanti"
                multiline
            />

            <FormActions
                error={error}
                busy={busy}
                onSave={save}
                onDelete={id ? remove : undefined}
                name="questo allenamento"
            />
        </ScrollView>
    );
}

/** The "+ Nuovo tipo" chip, which opens a name field under the chips. */
function NewType({ onCreated }: { onCreated: (type: WorkoutType) => void }) {
    const theme = useTheme();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const close = () => {
        setOpen(false);
        setName('');
        setError(null);
    };

    const add = async () => {
        if (!name.trim()) {
            setError('Scrivi il nome del tipo.');
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const res = await apiFetch('/api/workout-types', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            if (res.ok) {
                onCreated({
                    ...(await res.json()),
                    workouts: 0,
                    activity: null,
                });
                return close();
            }
            setError(
                res.status === 409
                    ? 'Esiste già un tipo con questo nome.'
                    : 'Non riesco ad aggiungere il tipo.'
            );
        } catch {
            setError('Non riesco ad aggiungere il tipo.');
        } finally {
            setBusy(false);
        }
    };

    if (!open) {
        return (
            <Pressable
                onPress={() => setOpen(true)}
                accessibilityRole="button"
                style={[
                    styles.chip,
                    { borderColor: theme.accent, borderWidth: 1 },
                ]}>
                <ThemedText style={{ color: theme.accent }}>
                    + Nuovo tipo
                </ThemedText>
            </Pressable>
        );
    }

    return (
        <View style={styles.newType}>
            <TextField
                label="Nome del tipo"
                value={name}
                onChange={setName}
                placeholder="Pilates"
                autoFocus
            />
            {error && (
                <ThemedText type="small" themeColor="danger">
                    {error}
                </ThemedText>
            )}
            <View style={styles.newTypeActions}>
                <Pressable
                    onPress={close}
                    disabled={busy}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                        styles.smallButton,
                        pressed && styles.pressed,
                    ]}>
                    <ThemedText themeColor="textMuted">Annulla</ThemedText>
                </Pressable>
                <Pressable
                    onPress={add}
                    disabled={busy}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                        styles.smallButton,
                        { backgroundColor: theme.accent },
                        (pressed || busy) && styles.pressed,
                    ]}>
                    <ThemedText style={{ color: theme.onAccent }}>
                        Aggiungi
                    </ThemedText>
                </Pressable>
            </View>
        </View>
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
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
    },
    grow: {
        flex: 1,
    },
    fieldGroup: {
        gap: Spacing.one,
    },
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.two,
    },
    chip: {
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        borderRadius: 999,
    },
    newType: {
        width: '100%',
        gap: Spacing.two,
    },
    newTypeActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: Spacing.two,
    },
    smallButton: {
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        borderRadius: 14,
    },
    pressed: {
        opacity: 0.6,
    },
});
