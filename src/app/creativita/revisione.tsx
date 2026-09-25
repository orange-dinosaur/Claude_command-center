import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CycleAnswers } from '@/components/cycle-answers';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { CLOSING_LABELS, CLOSING_SHIFT_LABELS } from '@/creativity/cycle';
import { formatDayRange } from '@/dates';
import { useCycle } from '@/hooks/use-cycles';
import { useTheme } from '@/hooks/use-theme';

export default function ClosingReview() {
    const theme = useTheme();
    const params = useLocalSearchParams<{ cycle: string }>();
    const { cycle, error } = useCycle(params.cycle);

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader title="Closing review" backTo="/creativita" />

                {cycle === undefined ? (
                    <ActivityIndicator
                        color={theme.textMuted}
                        style={styles.message}
                    />
                ) : cycle === null ? (
                    <ThemedText themeColor="danger" style={styles.message}>
                        {error}
                    </ThemedText>
                ) : (
                    <ScrollView contentContainerStyle={styles.page}>
                        <ThemedText themeColor="textMuted">
                            {formatDayRange(cycle.startDate, cycle.endDate)}
                        </ThemedText>
                        <View style={styles.section}>
                            <ThemedText type="small" themeColor="textMuted">
                                Three shifts I noticed
                            </ThemedText>
                            <CycleAnswers
                                cycle={cycle}
                                labels={CLOSING_SHIFT_LABELS}
                                multiline={false}
                            />
                        </View>
                        <CycleAnswers cycle={cycle} labels={CLOSING_LABELS} />
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
    page: {
        padding: Spacing.four,
        gap: Spacing.four,
    },
    section: {
        gap: Spacing.two,
    },
});
