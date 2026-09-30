/**
 * The form for a habit. A new habit gets a name, a tracking mode, and the
 * fields that mode needs. An existing one keeps its mode, and can move,
 * be archived or restored, and be deleted; the Sport habit only changes its
 * target and its place.
 */

import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    type StyleProp,
    View,
    type ViewStyle,
} from 'react-native';

import { apiFetch } from '@/auth/client';
import { FormActions } from '@/components/form-actions';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { AMOUNT_MAX, UNIT_MAX, WEEKLY_MAX } from '@/habits/stats';
import type { Habit } from '@/hooks/use-habits';
import { useTheme } from '@/hooks/use-theme';

const MODES: { mode: Habit['mode']; label: string }[] = [
    { mode: 'daily', label: 'Ogni giorno' },
    { mode: 'weekly', label: 'Giorni a settimana' },
    { mode: 'amount', label: 'Quantità' },
];

/** A whole number from 1 to `max`, or null. */
function parseCount(value: string, max: number): number | null {
    const n = /^\d+$/.test(value.trim()) ? Number(value) : NaN;
    return n >= 1 && n <= max ? n : null;
}

const json = { 'content-type': 'application/json' };

export function HabitForm({
    id,
    title,
    onSaved,
    onDeleted,
    onMoved,
    style,
}: {
    /** The habit to edit; without it the form adds a new one. */
    id?: string;
    /** Shown above the fields when the page has no header of its own. */
    title?: string;
    /** After a save, an archive or a restore. */
    onSaved: (id: string) => void;
    onDeleted: () => void;
    /** After "Sposta su" or "Sposta giù", for a list shown beside the form. */
    onMoved?: () => void;
    style?: StyleProp<ViewStyle>;
}) {
    const theme = useTheme();
    // undefined while loading, null when the habit is gone.
    const [habit, setHabit] = useState<Habit | null | undefined>(
        id ? undefined : null
    );
    const [name, setName] = useState('');
    const [mode, setMode] = useState<Habit['mode']>('daily');
    const [weeklyTarget, setWeeklyTarget] = useState('');
    const [unit, setUnit] = useState('');
    const [dailyTarget, setDailyTarget] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        apiFetch('/api/habits')
            .then((res) => (res.ok ? res.json() : Promise.reject()))
            .then((habits: Habit[]) => {
                if (cancelled) return;
                const found = habits.find((h) => h.id === id) ?? null;
                setHabit(found);
                if (!found) return;
                setName(found.name);
                setMode(found.mode);
                setWeeklyTarget(String(found.weeklyTarget ?? ''));
                setUnit(found.unit ?? '');
                setDailyTarget(String(found.dailyTarget ?? ''));
            })
            .catch(() => {
                if (cancelled) return;
                setHabit(null);
                setError('Non riesco a caricare l’abitudine.');
            });
        return () => {
            cancelled = true;
        };
    }, [id]);

    /** Sends a change; on failure shows `failure` and returns null. */
    const send = async (
        path: string,
        method: string,
        body?: object,
        failure = 'Non riesco a salvare l’abitudine.'
    ): Promise<Response | null> => {
        setBusy(true);
        setError(null);
        let res: Response | null = null;
        try {
            res = await apiFetch(path, {
                method,
                headers: body ? json : undefined,
                body: body ? JSON.stringify(body) : undefined,
            });
        } catch {
            res = null;
        }
        setBusy(false);
        if (res?.ok) return res;
        setError(failure);
        return null;
    };

    const save = async () => {
        const fields: Record<string, unknown> = {};
        if (!habit?.sport) {
            fields.name = name.trim();
            if (!fields.name) return setError('Scrivi un nome.');
        }
        if (!habit) fields.mode = mode;
        if (mode === 'weekly') {
            fields.weeklyTarget = parseCount(weeklyTarget, WEEKLY_MAX);
            if (!fields.weeklyTarget) {
                return setError(
                    `I giorni a settimana vanno da 1 a ${WEEKLY_MAX}.`
                );
            }
        }
        if (mode === 'amount') {
            fields.unit = unit.trim();
            fields.dailyTarget = parseCount(dailyTarget, AMOUNT_MAX);
            if (!fields.unit || unit.trim().length > UNIT_MAX) {
                return setError(
                    `Scrivi un’unità di massimo ${UNIT_MAX} caratteri.`
                );
            }
            if (!fields.dailyTarget) {
                return setError('L’obiettivo è un numero intero da 1 in su.');
            }
        }

        const res = habit
            ? await send(`/api/habits/${habit.id}`, 'PATCH', fields)
            : await send('/api/habits', 'POST', fields);
        if (res) onSaved(habit?.id ?? ((await res.json()) as Habit).id);
    };

    const archive = async (archived: boolean) => {
        const path = `/api/habits/${habit!.id}`;
        if (await send(path, 'PATCH', { archived })) onSaved(habit!.id);
    };

    const move = async (direction: 'up' | 'down') => {
        const path = `/api/habits/${habit!.id}`;
        const failure = 'Non riesco a spostare l’abitudine.';
        if (await send(path, 'PATCH', { move: direction }, failure)) {
            onMoved?.();
        }
    };

    const remove = async () => {
        const path = `/api/habits/${habit!.id}`;
        const failure = 'Non riesco a eliminare l’abitudine.';
        if (await send(path, 'DELETE', undefined, failure)) onDeleted();
    };

    if (habit === undefined) {
        return (
            <ActivityIndicator color={theme.textMuted} style={styles.loading} />
        );
    }
    if (id && !habit) {
        return (
            <ThemedText themeColor="textMuted" style={styles.missing}>
                {error ?? 'Questa abitudine non c’è più.'}
            </ThemedText>
        );
    }

    const link = (label: string, onPress: () => void) => (
        <Pressable
            onPress={onPress}
            disabled={busy}
            accessibilityRole="button"
            style={({ pressed }) => [
                styles.link,
                { borderColor: theme.border },
                pressed && styles.pressed,
            ]}>
            <ThemedText>{label}</ThemedText>
        </Pressable>
    );

    return (
        <ScrollView contentContainerStyle={[styles.body, style]}>
            {title && <ThemedText type="title">{title}</ThemedText>}
            {!habit?.sport && (
                <TextField
                    label="Nome"
                    value={name}
                    onChange={setName}
                    placeholder="Lettura"
                />
            )}
            <View style={styles.fieldGroup}>
                <ThemedText type="small" themeColor="textMuted">
                    Come la segni
                </ThemedText>
                {habit ? (
                    <ThemedText>
                        {MODES.find((m) => m.mode === mode)?.label}
                        {habit.sport && ', dagli allenamenti in Sport'}
                    </ThemedText>
                ) : (
                    <View style={styles.chips}>
                        {MODES.map((m) => {
                            const selected = m.mode === mode;
                            return (
                                <Pressable
                                    key={m.mode}
                                    onPress={() => setMode(m.mode)}
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
                                            selected && {
                                                color: theme.onAccent,
                                            }
                                        }>
                                        {m.label}
                                    </ThemedText>
                                </Pressable>
                            );
                        })}
                    </View>
                )}
            </View>
            {mode === 'weekly' && (
                <TextField
                    label="Giorni a settimana"
                    value={weeklyTarget}
                    onChange={setWeeklyTarget}
                    placeholder="3"
                    keyboardType="number-pad"
                />
            )}
            {mode === 'amount' && (
                <>
                    <TextField
                        label="Unità"
                        value={unit}
                        onChange={setUnit}
                        placeholder="bicchieri"
                    />
                    <TextField
                        label="Obiettivo al giorno"
                        value={dailyTarget}
                        onChange={setDailyTarget}
                        placeholder="8"
                        keyboardType="number-pad"
                    />
                </>
            )}
            {habit && !habit.archivedAt && (
                <View style={styles.row}>
                    {link('Sposta su', () => move('up'))}
                    {link('Sposta giù', () => move('down'))}
                </View>
            )}
            {habit?.archivedAt && link('Ripristina', () => archive(false))}
            <FormActions
                error={error}
                busy={busy}
                onSave={save}
                onDelete={habit && !habit.sport ? remove : undefined}
                name={`“${name}”`}
                extra={
                    habit && !habit.sport && !habit.archivedAt
                        ? {
                              label: 'Archivia',
                              question: `Archiviare “${name}”?`,
                              onConfirm: () => archive(true),
                          }
                        : undefined
                }
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    loading: {
        paddingVertical: Spacing.three,
    },
    missing: {
        padding: Spacing.four,
        textAlign: 'center',
    },
    body: {
        flexGrow: 1,
        padding: Spacing.four,
        gap: Spacing.three,
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
    row: {
        flexDirection: 'row',
        gap: Spacing.two,
    },
    link: {
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        borderRadius: 999,
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    pressed: {
        opacity: 0.6,
    },
});
