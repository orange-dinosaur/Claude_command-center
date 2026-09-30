import { Redirect, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { todayDay } from '@/dates';
import { HabitDetail } from '@/habits/habit-detail';
import { useDayPress } from '@/habits/use-day-press';
import { useHabits } from '@/hooks/use-habits';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useTheme } from '@/hooks/use-theme';

/** One habit's months, on the phone. */
export default function HabitPage() {
    const theme = useTheme();
    const isDesktop = useIsDesktop();
    const { id } = useLocalSearchParams<{ id: string }>();
    const today = todayDay();
    const { habits, error, mark, unmark } = useHabits();
    const { press, sheet } = useDayPress({ mark, unmark });
    const habit = habits?.find((h) => h.id === id);

    // On desktop the detail lives in the panel beside the week.
    if (isDesktop) {
        return <Redirect href={{ pathname: '/abitudini', params: { id } }} />;
    }

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
                ) : habit ? (
                    <HabitDetail
                        habit={habit}
                        today={today}
                        onPressDay={(day) => press(habit, day)}
                    />
                ) : (
                    <ThemedText themeColor="textMuted" style={styles.message}>
                        Questa abitudine non c’è più.
                    </ThemedText>
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
});
