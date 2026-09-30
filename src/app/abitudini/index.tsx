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
import { addDays, formatDayRange, todayDay } from '@/dates';
import { AmountSheet } from '@/habits/amount-sheet';
import { dayOf, mondayOf } from '@/habits/stats';
import { WeekRow } from '@/habits/week-row';
import { useHabits, type Habit } from '@/hooks/use-habits';
import { useTheme } from '@/hooks/use-theme';

export default function Abitudini() {
    const theme = useTheme();
    const today = todayDay();
    const { habits, error, mark, unmark } = useHabits();
    const thisMonday = mondayOf(today);
    const [monday, setMonday] = useState(thisMonday);
    // The amount habit and day whose sheet is open.
    const [editing, setEditing] = useState<{ id: string; day: string }>();

    const active = habits?.filter((h) => !h.archivedAt);
    const editingHabit = habits?.find((h) => h.id === editing?.id);

    const pressDay = (habit: Habit, day: string) => {
        // ponytail: Sport cells do nothing until they open Sport.
        if (habit.sport) return;
        if (habit.mode === 'amount') setEditing({ id: habit.id, day });
        else if (dayOf(habit, day)) unmark(habit, day);
        else mark(habit, day);
    };

    const arrow = (
        symbol: string,
        label: string,
        to: string,
        disabled = false
    ) => (
        <Pressable
            onPress={() => setMonday(to)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={label}
            hitSlop={Spacing.two}
            style={({ pressed }) => [
                styles.arrow,
                disabled && styles.disabled,
                pressed && styles.pressed,
            ]}>
            <ThemedText type="subtitle">{symbol}</ThemedText>
        </Pressable>
    );

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader title="Abitudini" backTo="/command-center" />
                {error && (
                    <ThemedText
                        type="small"
                        themeColor="danger"
                        style={styles.message}>
                        {error}
                    </ThemedText>
                )}
                {active === undefined ? (
                    <ActivityIndicator
                        color={theme.textMuted}
                        style={styles.message}
                    />
                ) : (
                    <ScrollView contentContainerStyle={styles.list}>
                        <View style={styles.week}>
                            {arrow('‹', 'Settimana prima', addDays(monday, -7))}
                            <ThemedText style={styles.range}>
                                {formatDayRange(monday, addDays(monday, 6))}
                            </ThemedText>
                            {arrow(
                                '›',
                                'Settimana dopo',
                                addDays(monday, 7),
                                monday >= thisMonday
                            )}
                        </View>
                        {active.map((habit) => (
                            <WeekRow
                                key={habit.id}
                                habit={habit}
                                monday={monday}
                                today={today}
                                onPressDay={(day) => pressDay(habit, day)}
                            />
                        ))}
                        {active.length === 1 && (
                            <ThemedText
                                themeColor="textMuted"
                                style={styles.message}>
                                Aggiungi le abitudini che vuoi seguire. Sport si
                                segna da sola con i tuoi allenamenti.
                            </ThemedText>
                        )}
                    </ScrollView>
                )}
            </SafeAreaView>
            {editing && editingHabit && (
                <AmountSheet
                    key={`${editing.id}-${editing.day}`}
                    habit={editingHabit}
                    day={editing.day}
                    onSave={(amount) => mark(editingHabit, editing.day, amount)}
                    onClose={() => setEditing(undefined)}
                />
            )}
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
    list: {
        padding: Spacing.four,
        gap: Spacing.three,
    },
    week: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    range: {
        flex: 1,
        textAlign: 'center',
    },
    arrow: {
        paddingHorizontal: Spacing.three,
    },
    disabled: {
        opacity: 0.3,
    },
    pressed: {
        opacity: 0.6,
    },
});
