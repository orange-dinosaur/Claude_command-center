import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/**
 * One dot per episode of a season, filled up to the episodes watched. A tap
 * on a dot calls `onPress` with its episode number, counted from 1.
 */
export function EpisodeDots({
    episodes,
    watched,
    onAccent,
    onPress,
}: {
    episodes: number;
    watched: number;
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
                        accessibilityLabel={`Episodio ${episode}`}
                        style={[
                            styles.dot,
                            { backgroundColor: checked ? full : empty },
                            onAccent && !checked && styles.faint,
                        ]}
                    />
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    dots: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 6,
    },
    dot: {
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    faint: {
        opacity: 0.4,
    },
});
