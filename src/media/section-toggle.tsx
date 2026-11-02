import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** The header of a list section that opens with a tap, with its row count. */
export function SectionToggle({
    label,
    count,
    open,
    onPress,
}: {
    label: string;
    count: number;
    open: boolean;
    onPress: () => void;
}) {
    const theme = useTheme();

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            style={({ pressed }) => [styles.header, pressed && styles.pressed]}>
            <ThemedText type="subtitle" style={styles.grow}>
                {label}
            </ThemedText>
            <ThemedText themeColor="textMuted">{count}</ThemedText>
            <SymbolView
                name={
                    open
                        ? {
                              ios: 'chevron.down',
                              android: 'expand_more',
                              web: 'expand_more',
                          }
                        : {
                              ios: 'chevron.right',
                              android: 'chevron_right',
                              web: 'chevron_right',
                          }
                }
                tintColor={theme.textMuted}
                size={24}
            />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
    },
    pressed: {
        opacity: 0.6,
    },
    grow: {
        flex: 1,
    },
});
