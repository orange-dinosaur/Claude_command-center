/**
 * One habit: its target, this month as a calendar, then a line per earlier
 * month that opens that month's calendar underneath.
 */

import { type ReactNode, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    type StyleProp,
    View,
    type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { MonthCalendar } from '@/habits/month-calendar';
import { historyMonths, monthSummary } from '@/habits/stats';
import { describeTarget } from '@/habits/week-row';
import type { Habit } from '@/hooks/use-habits';
import { useTheme } from '@/hooks/use-theme';
import { formatMonth } from '@/sport/riepilogo';

/** "18 giorni su 30", plus "2 settimane su 4" for weekly habits. */
function describeMonth(habit: Habit, month: string): string {
    const { done, days, weeks } = monthSummary(habit, month);
    const text = `${done} ${done === 1 ? 'giorno' : 'giorni'} su ${days}`;
    if (!weeks) return text;
    const unit = weeks.reached === 1 ? 'settimana' : 'settimane';
    return `${text} · ${weeks.reached} ${unit} su ${weeks.total}`;
}

export function HabitDetail({
    habit,
    today,
    onPressDay,
    header,
    style,
}: {
    habit: Habit;
    today: string;
    onPressDay: (day: string) => void;
    /** Shown first, for pages without a header of their own. */
    header?: ReactNode;
    style?: StyleProp<ViewStyle>;
}) {
    const theme = useTheme();
    // Past months opened by hand, keyed `YYYY-MM`.
    const [open, setOpen] = useState<Record<string, boolean>>({});
    const [current, ...past] = historyMonths(habit, today);

    return (
        <ScrollView contentContainerStyle={[styles.body, style]}>
            {header}
            <ThemedText themeColor="textMuted">
                {describeTarget(habit)}
                {habit.archivedAt && ' · Archiviata'}
            </ThemedText>
            <View style={styles.month}>
                <ThemedText type="subtitle">{formatMonth(current)}</ThemedText>
                <MonthCalendar
                    habit={habit}
                    month={current}
                    today={today}
                    onPressDay={onPressDay}
                />
            </View>
            {past.map((month) => (
                <View key={month} style={styles.month}>
                    <Pressable
                        onPress={() =>
                            setOpen((o) => ({ ...o, [month]: !o[month] }))
                        }
                        accessibilityRole="button"
                        accessibilityState={{ expanded: !!open[month] }}
                        style={({ pressed }) => [
                            styles.monthLine,
                            { borderTopColor: theme.border },
                            pressed && styles.pressed,
                        ]}>
                        <ThemedText style={styles.grow}>
                            {formatMonth(month)}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textMuted">
                            {describeMonth(habit, month)}
                        </ThemedText>
                    </Pressable>
                    {open[month] && (
                        <MonthCalendar
                            habit={habit}
                            month={month}
                            today={today}
                            onPressDay={onPressDay}
                        />
                    )}
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    body: {
        padding: Spacing.four,
        gap: Spacing.three,
    },
    month: {
        gap: Spacing.two,
    },
    monthLine: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: Spacing.two,
        paddingTop: Spacing.three,
        borderTopWidth: 1,
    },
    grow: {
        flex: 1,
    },
    pressed: {
        opacity: 0.6,
    },
});
