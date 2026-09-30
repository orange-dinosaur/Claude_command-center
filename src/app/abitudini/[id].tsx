import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { todayDay } from '@/dates';
import { MonthCalendar } from '@/habits/month-calendar';
import { historyMonths, monthSummary } from '@/habits/stats';
import { useDayPress } from '@/habits/use-day-press';
import { describeTarget } from '@/habits/week-row';
import { useHabits, type Habit } from '@/hooks/use-habits';
import { useTheme } from '@/hooks/use-theme';
import { formatMonth } from '@/sport/riepilogo';

/** "18 giorni su 30", plus "2 settimane su 4" for weekly habits. */
function describeMonth(habit: Habit, month: string): string {
    const { done, days, weeks } = monthSummary(habit, month);
    const text = `${done} ${done === 1 ? 'giorno' : 'giorni'} su ${days}`;
    return weeks
        ? `${text} · ${weeks.reached} ${weeks.reached === 1 ? 'settimana' : 'settimane'} su ${weeks.total}`
        : text;
}

/** One habit: this month as a calendar, then a line per earlier month. */
export default function HabitDetail() {
    const theme = useTheme();
    const { id } = useLocalSearchParams<{ id: string }>();
    const today = todayDay();
    const { habits, error, mark, unmark } = useHabits();
    const { press, sheet } = useDayPress({ mark, unmark });
    // Past months opened by hand, keyed `YYYY-MM`.
    const [open, setOpen] = useState<Record<string, boolean>>({});

    const habit = habits?.find((h) => h.id === id);
    const [current, ...past] = habit ? historyMonths(habit, today) : [];

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader
                    title={habit?.name ?? 'Abitudine'}
                    backTo="/abitudini"
                    link={
                        habit && {
                            label: 'Modifica',
                            href: {
                                pathname: '/abitudini/abitudine',
                                params: { id: habit.id },
                            },
                        }
                    }
                />
                {error && (
                    <ThemedText
                        type="small"
                        themeColor="danger"
                        style={styles.message}>
                        {error}
                    </ThemedText>
                )}
                {habits === undefined ? (
                    <ActivityIndicator
                        color={theme.textMuted}
                        style={styles.message}
                    />
                ) : !habit ? (
                    <ThemedText themeColor="textMuted" style={styles.message}>
                        Questa abitudine non c’è più.
                    </ThemedText>
                ) : (
                    <ScrollView contentContainerStyle={styles.body}>
                        <ThemedText themeColor="textMuted">
                            {describeTarget(habit)}
                            {habit.archivedAt && ' · Archiviata'}
                        </ThemedText>
                        <View style={styles.month}>
                            <ThemedText type="subtitle">
                                {formatMonth(current)}
                            </ThemedText>
                            <MonthCalendar
                                habit={habit}
                                month={current}
                                today={today}
                                onPressDay={(day) => press(habit, day)}
                            />
                        </View>
                        {past.map((month) => (
                            <View key={month} style={styles.month}>
                                <Pressable
                                    onPress={() =>
                                        setOpen((o) => ({
                                            ...o,
                                            [month]: !o[month],
                                        }))
                                    }
                                    accessibilityRole="button"
                                    accessibilityState={{
                                        expanded: !!open[month],
                                    }}
                                    style={({ pressed }) => [
                                        styles.monthLine,
                                        { borderTopColor: theme.border },
                                        pressed && styles.pressed,
                                    ]}>
                                    <ThemedText style={styles.grow}>
                                        {formatMonth(month)}
                                    </ThemedText>
                                    <ThemedText
                                        type="small"
                                        themeColor="textMuted">
                                        {describeMonth(habit, month)}
                                    </ThemedText>
                                </Pressable>
                                {open[month] && (
                                    <MonthCalendar
                                        habit={habit}
                                        month={month}
                                        today={today}
                                        onPressDay={(day) => press(habit, day)}
                                    />
                                )}
                            </View>
                        ))}
                    </ScrollView>
                )}
            </SafeAreaView>
            {sheet}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    message: {
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.three,
        textAlign: 'center',
    },
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
