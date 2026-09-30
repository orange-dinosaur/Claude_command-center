/**
 * The form for a new habit: its name, its tracking mode, and the fields that
 * mode needs.
 */

import { useState } from 'react';
import {
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

export function HabitForm({
    title,
    onSaved,
    style,
}: {
    /** Shown above the fields when the page has no header of its own. */
    title?: string;
    onSaved: (id: string) => void;
    style?: StyleProp<ViewStyle>;
}) {
    const theme = useTheme();
    const [name, setName] = useState('');
    const [mode, setMode] = useState<Habit['mode']>('daily');
    const [weeklyTarget, setWeeklyTarget] = useState('');
    const [unit, setUnit] = useState('');
    const [dailyTarget, setDailyTarget] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const save = async () => {
        const fields: Record<string, unknown> = { name: name.trim(), mode };
        if (!fields.name) return setError('Scrivi un nome.');
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

        setBusy(true);
        setError(null);
        try {
            const res = await apiFetch('/api/habits', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(fields),
            });
            if (res.ok) return onSaved(((await res.json()) as Habit).id);
            setError('Non riesco a salvare l’abitudine.');
        } catch {
            setError('Non riesco a salvare l’abitudine.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={[styles.body, style]}>
            {title && <ThemedText type="title">{title}</ThemedText>}
            <TextField
                label="Nome"
                value={name}
                onChange={setName}
                placeholder="Lettura"
            />
            <View style={styles.fieldGroup}>
                <ThemedText type="small" themeColor="textMuted">
                    Come la segni
                </ThemedText>
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
                                        selected && { color: theme.onAccent }
                                    }>
                                    {m.label}
                                </ThemedText>
                            </Pressable>
                        );
                    })}
                </View>
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
            <FormActions
                error={error}
                busy={busy}
                onSave={save}
                name="questa abitudine"
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
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
});
