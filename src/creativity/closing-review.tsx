import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    View,
    type StyleProp,
    type ViewStyle,
} from 'react-native';

import { CycleAnswers } from '@/components/cycle-answers';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { CLOSING_LABELS, CLOSING_SHIFT_LABELS } from '@/creativity/cycle';
import { formatDayRange } from '@/dates';
import { useCycle } from '@/hooks/use-cycles';
import { useTheme } from '@/hooks/use-theme';

/** The reflection that closes the cycle with `cycleId`. */
export function ClosingReview({
    cycleId,
    title,
    style,
}: {
    cycleId: string;
    /** Shown above the fields when the page has no header of its own. */
    title?: string;
    style?: StyleProp<ViewStyle>;
}) {
    const theme = useTheme();
    const { cycle, error } = useCycle(cycleId);

    if (cycle === undefined) {
        return (
            <ActivityIndicator color={theme.textMuted} style={styles.message} />
        );
    }
    if (cycle === null) {
        return (
            <ThemedText themeColor="danger" style={styles.message}>
                {error}
            </ThemedText>
        );
    }

    return (
        <ScrollView contentContainerStyle={[styles.page, style]}>
            {title && <ThemedText type="title">{title}</ThemedText>}
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
    );
}

const styles = StyleSheet.create({
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
