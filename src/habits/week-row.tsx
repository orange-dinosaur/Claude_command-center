/**
 * One habit in the week view: its name, its progress, and a cell per day.
 * The day cell is shared with the month calendar.
 */

import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { formatDay } from '@/dates';
import {
    dayOf,
    isDone,
    shortAmount,
    weekCount,
    weekDays,
} from '@/habits/stats';
import type { Habit } from '@/hooks/use-habits';
import { useTheme } from '@/hooks/use-theme';

export const LETTERS = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

/** One day of a habit: filled when done, dashed in the future. */
export function DayCell({
    habit,
    day,
    today,
    onPress,
}: {
    habit: Habit;
    day: string;
    today: string;
    onPress: () => void;
}) {
    const theme = useTheme();
    const future = day > today;
    const done = isDone(habit, day);
    const amount = dayOf(habit, day)?.amount;

    return (
        <Pressable
            onPress={onPress}
            disabled={future}
            accessibilityRole={habit.mode === 'amount' ? 'button' : 'checkbox'}
            aria-checked={done}
            accessibilityLabel={`${habit.name}, ${formatDay(day)}`}
            style={({ pressed }) => [
                styles.cell,
                { borderColor: theme.markEmpty },
                done && {
                    backgroundColor: theme.accent,
                    borderColor: theme.accent,
                },
                future && styles.future,
                pressed && styles.pressed,
            ]}>
            <ThemedText
                type="small"
                style={[
                    day === today && styles.today,
                    done && { color: theme.onAccent },
                ]}>
                {amount != null
                    ? shortAmount(amount)
                    : done
                      ? '✓'
                      : Number(day.slice(8))}
            </ThemedText>
        </Pressable>
    );
}

/** "3 giorni a settimana", "8 bicchieri al giorno" or "Ogni giorno". */
export function describeTarget(habit: Habit): string {
    if (habit.mode === 'weekly') {
        return `${habit.weeklyTarget} giorni a settimana`;
    }
    if (habit.mode === 'amount') {
        return `${habit.dailyTarget} ${habit.unit} al giorno`;
    }
    return 'Ogni giorno';
}

interface WeekRowProps {
    habit: Habit;
    monday: string;
    today: string;
    /** The habit open in the desktop panel. */
    selected?: boolean;
    onPressDay: (day: string) => void;
    onPressName: () => void;
}

export function WeekRow({
    habit,
    monday,
    today,
    selected = false,
    onPressDay,
    onPressName,
}: WeekRowProps) {
    const count = weekCount(habit, monday);
    const reached =
        habit.mode === 'weekly' && count >= (habit.weeklyTarget ?? 0);

    return (
        <View style={styles.row}>
            <Pressable
                onPress={onPressName}
                accessibilityRole="link"
                style={({ pressed }) => [
                    styles.heading,
                    pressed && styles.pressed,
                ]}>
                <ThemedText
                    themeColor={selected ? 'accent' : 'text'}
                    style={styles.grow}>
                    {habit.name}
                </ThemedText>
                {habit.mode === 'weekly' && (
                    <ThemedText
                        type="small"
                        themeColor={reached ? 'accent' : 'textMuted'}>
                        {count} di {habit.weeklyTarget}
                        {reached && ' ✓'}
                    </ThemedText>
                )}
                {habit.mode === 'amount' && (
                    <ThemedText type="small" themeColor="textMuted">
                        {describeTarget(habit)}
                    </ThemedText>
                )}
            </Pressable>
            <View style={styles.days}>
                {weekDays(monday).map((day) => (
                    <DayCell
                        key={day}
                        habit={habit}
                        day={day}
                        today={today}
                        onPress={() => onPressDay(day)}
                    />
                ))}
            </View>
        </View>
    );
}

/**
 * The day letters, once above the week rows, one per cell column. Opaque so
 * it can stay pinned while the rows scroll under it.
 */
export function WeekLetters() {
    return (
        <ThemedView style={styles.days}>
            {LETTERS.map((letter, i) => (
                <ThemedText
                    key={i}
                    type="small"
                    themeColor="textMuted"
                    style={styles.letter}>
                    {letter}
                </ThemedText>
            ))}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    row: {
        gap: Spacing.one,
        paddingVertical: Spacing.one,
    },
    heading: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: Spacing.two,
    },
    grow: {
        flex: 1,
    },
    days: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    letter: {
        width: 34,
        textAlign: 'center',
    },
    cell: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    future: {
        borderStyle: 'dashed',
        opacity: 0.5,
    },
    today: {
        fontFamily: 'Karla_600SemiBold',
    },
    pressed: {
        opacity: 0.6,
    },
});
