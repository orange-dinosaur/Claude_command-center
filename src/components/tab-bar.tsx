import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface TabBarProps<T extends string> {
    tabs: readonly T[];
    value: T;
    onChange: (tab: T) => void;
}

/** A row of equal segments, one of them selected. */
export function TabBar<T extends string>({
    tabs,
    value,
    onChange,
}: TabBarProps<T>) {
    const theme = useTheme();

    return (
        <View
            accessibilityRole="tablist"
            style={[styles.bar, { backgroundColor: theme.backgroundElement }]}>
            {tabs.map((tab) => {
                const selected = tab === value;
                return (
                    <Pressable
                        key={tab}
                        onPress={() => onChange(tab)}
                        accessibilityRole="tab"
                        accessibilityState={{ selected }}
                        style={[
                            styles.tab,
                            selected && { backgroundColor: theme.accent },
                        ]}>
                        <ThemedText
                            style={[
                                styles.label,
                                selected && { color: theme.onAccent },
                            ]}>
                            {tab}
                        </ThemedText>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    bar: {
        flexDirection: 'row',
        marginHorizontal: Spacing.four,
        padding: Spacing.one,
        borderRadius: 14,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing.two,
        borderRadius: 10,
    },
    label: {
        fontFamily: 'Karla_600SemiBold',
    },
});
