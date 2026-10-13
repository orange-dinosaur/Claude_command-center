import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTools } from '@/hooks/use-tools';

/** Every tool in the saved order, with a switch to show or hide it. */
export function ToolList() {
    const theme = useTheme();
    const { tools, save } = useTools();
    const [error, setError] = useState(false);

    const toggle = async (key: string, visible: boolean) => {
        setError(false);
        const ok = await save(
            tools.map((tool) => ({
                key: tool.key,
                hidden: tool.key === key ? !visible : tool.hidden,
            }))
        );
        if (!ok) setError(true);
    };

    return (
        <View style={styles.list}>
            <ThemedText type="subtitle">Strumenti</ThemedText>
            {tools.map((tool) => (
                <View
                    key={tool.key}
                    style={[
                        styles.row,
                        { backgroundColor: theme.backgroundElement },
                    ]}>
                    <View style={[styles.content, tool.hidden && styles.faded]}>
                        <SymbolView
                            name={{
                                ios: 'line.3.horizontal',
                                android: 'drag_handle',
                                web: 'drag_handle',
                            }}
                            tintColor={theme.textMuted}
                            size={22}
                        />
                        <SymbolView
                            name={tool.icon}
                            tintColor={theme.accent}
                            size={24}
                        />
                        <ThemedText style={styles.grow}>
                            {tool.title}
                        </ThemedText>
                    </View>
                    <Switch
                        value={!tool.hidden}
                        onValueChange={(visible) => toggle(tool.key, visible)}
                        accessibilityLabel={tool.title}
                        trackColor={{ false: theme.border, true: theme.accent }}
                    />
                </View>
            ))}
            {error && (
                <ThemedText themeColor="danger">
                    Non riesco a salvare. Riprova.
                </ThemedText>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    list: {
        gap: Spacing.two,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.three,
        borderRadius: 14,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
    },
    faded: {
        opacity: 0.4,
    },
    grow: {
        flex: 1,
    },
});
