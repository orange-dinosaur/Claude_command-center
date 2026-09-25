/**
 * A tick box, and a tappable row with a box and a label.
 */

import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Box({ checked }: { checked: boolean }) {
    const theme = useTheme();
    return (
        <View
            style={[
                styles.box,
                { borderColor: theme.accent },
                checked && { backgroundColor: theme.accent },
            ]}>
            {checked && (
                <ThemedText type="small" style={{ color: theme.onAccent }}>
                    ✓
                </ThemedText>
            )}
        </View>
    );
}

export function Check({
    label,
    checked,
    onPress,
}: {
    label: string;
    checked: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="checkbox"
            aria-checked={checked}
            style={({ pressed }) => [styles.check, pressed && styles.pressed]}>
            <Box checked={checked} />
            <ThemedText style={styles.grow}>{label}</ThemedText>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    box: {
        width: 26,
        height: 26,
        borderRadius: 6,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    check: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        paddingVertical: Spacing.one,
    },
    grow: {
        flex: 1,
    },
    pressed: {
        opacity: 0.6,
    },
});
