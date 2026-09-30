/**
 * The sheet that sets one day's number on an amount habit. Saving 0 or
 * pressing "Azzera" clears the day.
 */

import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Sheet } from '@/components/sheet';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { formatDay } from '@/dates';
import { AMOUNT_MAX, dayOf } from '@/habits/stats';
import type { Habit } from '@/hooks/use-habits';
import { useTheme } from '@/hooks/use-theme';

interface AmountSheetProps {
    habit: Habit;
    day: string;
    onSave: (amount: number) => void;
    onClose: () => void;
}

/** A whole number from 0 to AMOUNT_MAX, or NaN. */
function parseAmount(value: string): number {
    const n = /^\d+$/.test(value.trim()) ? Number(value) : NaN;
    return n <= AMOUNT_MAX ? n : NaN;
}

export function AmountSheet({ habit, day, onSave, onClose }: AmountSheetProps) {
    const theme = useTheme();
    const [value, setValue] = useState(String(dayOf(habit, day)?.amount ?? 0));
    const amount = parseAmount(value);
    const valid = !isNaN(amount);

    const step = (by: number) =>
        setValue((current) =>
            String(Math.max(0, (parseAmount(current) || 0) + by))
        );
    const save = (n: number) => {
        onSave(n);
        onClose();
    };

    const stepper = (label: string, by: number) => (
        <Pressable
            onPress={() => step(by)}
            accessibilityRole="button"
            accessibilityLabel={by > 0 ? 'Aggiungi uno' : 'Togli uno'}
            style={({ pressed }) => [
                styles.stepper,
                { borderColor: theme.border },
                pressed && styles.pressed,
            ]}>
            <ThemedText type="subtitle">{label}</ThemedText>
        </Pressable>
    );

    return (
        <Sheet visible onClose={onClose} style={styles.sheet}>
            <ThemedText type="subtitle" style={styles.center}>
                {habit.name}
            </ThemedText>
            <ThemedText themeColor="textMuted" style={styles.center}>
                {formatDay(day)} · obiettivo {habit.dailyTarget} {habit.unit}
            </ThemedText>
            <View style={styles.row}>
                {stepper('−', -1)}
                <View style={styles.grow}>
                    <TextField
                        label={habit.unit ?? ''}
                        value={value}
                        onChange={setValue}
                        placeholder="0"
                        keyboardType="number-pad"
                    />
                </View>
                {stepper('+', 1)}
            </View>
            <Pressable
                onPress={() => save(amount)}
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
            {dayOf(habit, day) && (
                <Pressable
                    onPress={() => save(0)}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                        styles.clear,
                        pressed && styles.pressed,
                    ]}>
                    <ThemedText themeColor="danger">Azzera</ThemedText>
                </Pressable>
            )}
        </Sheet>
    );
}

const styles = StyleSheet.create({
    sheet: {
        gap: Spacing.three,
        padding: Spacing.four,
    },
    center: {
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: Spacing.three,
    },
    grow: {
        flex: 1,
    },
    stepper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
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
    clear: {
        alignSelf: 'center',
        padding: Spacing.two,
    },
    disabled: {
        opacity: 0.4,
    },
    pressed: {
        opacity: 0.6,
    },
});
