import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddButton } from '@/components/list-column';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { addDays, formatDayRange, todayDay } from '@/dates';
import { mondayOf } from '@/habits/stats';
import { useDayPress } from '@/habits/use-day-press';
import { WeekRow } from '@/habits/week-row';
import { useHabits, type Habit } from '@/hooks/use-habits';
import { useTheme } from '@/hooks/use-theme';

export default function Abitudini() {
    const theme = useTheme();
    const router = useRouter();
    const today = todayDay();
    const { habits, error, mark, unmark } = useHabits();
    const { press, sheet } = useDayPress({ mark, unmark });
    const thisMonday = mondayOf(today);
    const [monday, setMonday] = useState(thisMonday);

    const active = habits?.filter((h) => !h.archivedAt);
    const archived = habits?.filter((h) => h.archivedAt) ?? [];
    const open = (habit: Habit) =>
        router.push({
            pathname: '/abitudini/[id]',
            params: { id: habit.id },
        });

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
                                onPressDay={(day) => press(habit, day)}
                                onPressName={() => open(habit)}
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
                        <AddButton
                            label="Nuova abitudine"
                            onPress={() => router.push('/abitudini/abitudine')}
                        />
                        {archived.length > 0 && (
                            <View style={styles.archived}>
                                <ThemedText type="subtitle">
                                    Archiviate
                                </ThemedText>
                                {archived.map((habit) => (
                                    <Pressable
                                        key={habit.id}
                                        onPress={() => open(habit)}
                                        accessibilityRole="link"
                                        style={({ pressed }) => [
                                            styles.archivedRow,
                                            { borderTopColor: theme.border },
                                            pressed && styles.pressed,
                                        ]}>
                                        <ThemedText>{habit.name}</ThemedText>
                                    </Pressable>
                                ))}
                            </View>
                        )}
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
    archived: {
        marginTop: Spacing.four,
        gap: Spacing.two,
    },
    archivedRow: {
        paddingVertical: Spacing.three,
        borderTopWidth: 1,
    },
    disabled: {
        opacity: 0.3,
    },
    pressed: {
        opacity: 0.6,
    },
});
