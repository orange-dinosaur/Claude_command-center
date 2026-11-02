import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/**
 * One dot per episode of a season, filled up to the episodes watched. A tap
 * on a dot calls `onPress` with its episode number, counted from 1. Saga
 * volumes use the same dots with their own `label`.
 */
export function EpisodeDots({
    episodes,
    watched,
    label = 'Episodio',
    onAccent,
    onPress,
}: {
    episodes: number;
    watched: number;
    label?: string;
    onAccent?: boolean;
    onPress: (episode: number) => void;
}) {
    const theme = useTheme();
    const full = onAccent ? theme.onAccent : theme.accent;
    const empty = onAccent ? theme.onAccent : theme.markEmpty;

    return (
        <View style={styles.dots}>
            {Array.from({ length: episodes }, (_, i) => {
                const episode = i + 1;
                const checked = episode <= watched;
                return (
                    <Pressable
                        key={episode}
                        onPress={() => onPress(episode)}
                        hitSlop={3}
                        accessibilityRole="checkbox"
                        aria-checked={checked}
                        accessibilityLabel={`${label} ${episode}`}
                        style={[
                            styles.dot,
                            { backgroundColor: checked ? full : empty },
                            onAccent && !checked && styles.faint,
                        ]}>
                        <Text
                            style={[
                                styles.number,
                                {
                                    color: onAccent
                                        ? theme.accent
                                        : checked
                                          ? theme.onAccent
                                          : theme.textMuted,
                                },
                            ]}>
                            {episode}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    dots: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 6,
    },
    dot: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        paddingHorizontal: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    number: {
        fontSize: 10,
        lineHeight: 12,
        fontVariant: ['tabular-nums'],
    },
    faint: {
        opacity: 0.4,
    },
});
