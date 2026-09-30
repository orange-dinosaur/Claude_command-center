/**
 * A month of one habit as a calendar, Monday first, with the same day cells
 * as the week view.
 */

import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { mondayOf, monthDays } from '@/habits/stats';
import { DayCell, LETTERS } from '@/habits/week-row';
import type { Habit } from '@/hooks/use-habits';
import { daysBetween } from '@/dates';

interface MonthCalendarProps {
    habit: Habit;
    /** `YYYY-MM`. */
    month: string;
    today: string;
    onPressDay: (day: string) => void;
}

export function MonthCalendar({
    habit,
    month,
    today,
    onPressDay,
}: MonthCalendarProps) {
    const days = monthDays(month);
    // Blank cells before the 1st, so it sits under its weekday.
    const blanks = daysBetween(mondayOf(days[0]), days[0]);
    const cells: (string | null)[] = [...Array(blanks).fill(null), ...days];
    while (cells.length % 7) cells.push(null);
    const weeks = Array.from({ length: cells.length / 7 }, (_, i) =>
        cells.slice(i * 7, i * 7 + 7)
    );

    return (
        <View style={styles.calendar}>
            <View style={styles.week}>
                {LETTERS.map((letter, i) => (
                    <ThemedText
                        key={i}
                        type="small"
                        themeColor="textMuted"
                        style={styles.slot}>
                        {letter}
                    </ThemedText>
                ))}
            </View>
            {weeks.map((week, i) => (
                <View key={i} style={styles.week}>
                    {week.map((day, j) => (
                        <View key={day ?? `blank-${j}`} style={styles.slot}>
                            {day && (
                                <DayCell
                                    habit={habit}
                                    day={day}
                                    today={today}
                                    onPress={() => onPressDay(day)}
                                />
                            )}
                        </View>
                    ))}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    calendar: {
        gap: Spacing.two,
    },
    week: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    slot: {
        width: 40,
        alignItems: 'center',
        textAlign: 'center',
    },
});
