import { useRouter } from 'expo-router';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { cycleState } from '@/creativity/cycle';
import { formatDayRange, todayDay } from '@/dates';
import { useCycles } from '@/hooks/use-cycles';
import { useTheme } from '@/hooks/use-theme';

export default function PastCycles() {
    const theme = useTheme();
    const router = useRouter();
    const { cycles, error } = useCycles();
    const today = todayDay();
    // The newest cycle is the one the cycle screen shows.
    const past = cycles?.slice(1) ?? [];

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader title="Cicli passati" backTo="/creativita" />

                {error && (
                    <ThemedText
                        type="small"
                        themeColor="danger"
                        style={styles.message}>
                        {error}
                    </ThemedText>
                )}

                {cycles === undefined ? (
                    <ActivityIndicator
                        color={theme.textMuted}
                        style={styles.message}
                    />
                ) : past.length === 0 ? (
                    <ThemedText themeColor="textMuted" style={styles.message}>
                        Nessun ciclo passato.
                    </ThemedText>
                ) : (
                    <ScrollView contentContainerStyle={styles.list}>
                        {past.map((cycle) => (
                            <Pressable
                                key={cycle.id}
                                onPress={() =>
                                    router.push({
                                        pathname: '/creativita',
                                        params: { id: cycle.id },
                                    })
                                }
                                accessibilityRole="button"
                                style={({ pressed }) => [
                                    styles.row,
                                    {
                                        backgroundColor:
                                            theme.backgroundElement,
                                    },
                                    pressed && styles.pressed,
                                ]}>
                                <ThemedText>
                                    {formatDayRange(
                                        cycle.startDate,
                                        cycle.endDate
                                    )}
                                </ThemedText>
                                <ThemedText type="small" themeColor="textMuted">
                                    {cycleState(cycle, today)}
                                </ThemedText>
                            </Pressable>
                        ))}
                    </ScrollView>
                )}
            </SafeAreaView>
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
        gap: Spacing.two,
    },
    row: {
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.three,
        borderRadius: 14,
    },
    pressed: {
        opacity: 0.6,
    },
});
