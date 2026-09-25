import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    type StyleProp,
    type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { cycleState } from '@/creativity/cycle';
import { formatDayRange, todayDay } from '@/dates';
import { useCycles } from '@/hooks/use-cycles';
import { useTheme } from '@/hooks/use-theme';

/** Every cycle but the newest, which the cycle screen shows. */
export function PastCycles({
    onOpen,
    title,
    style,
}: {
    onOpen: (id: string) => void;
    /** Shown above the list when the page has no header of its own. */
    title?: string;
    style?: StyleProp<ViewStyle>;
}) {
    const theme = useTheme();
    const { cycles, error } = useCycles();
    const today = todayDay();
    const past = cycles?.slice(1) ?? [];

    return (
        <ScrollView contentContainerStyle={[styles.list, style]}>
            {title && (
                <ThemedText type="title" style={styles.title}>
                    {title}
                </ThemedText>
            )}

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
                past.map((cycle) => (
                    <Pressable
                        key={cycle.id}
                        onPress={() => onOpen(cycle.id)}
                        accessibilityRole="button"
                        style={({ pressed }) => [
                            styles.row,
                            { backgroundColor: theme.backgroundElement },
                            pressed && styles.pressed,
                        ]}>
                        <ThemedText>
                            {formatDayRange(cycle.startDate, cycle.endDate)}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textMuted">
                            {cycleState(cycle, today)}
                        </ThemedText>
                    </Pressable>
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    message: {
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.three,
        textAlign: 'center',
    },
    list: {
        padding: Spacing.four,
        gap: Spacing.two,
    },
    title: {
        marginBottom: Spacing.two,
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
