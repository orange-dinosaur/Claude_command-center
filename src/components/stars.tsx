import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { useTheme } from '@/hooks/use-theme';

interface StarsProps {
    /** Half stars, 1 to 10, or null for none. */
    rating: number | null;
    /**
     * Makes the stars tappable: the left half of a star gives a half star,
     * the right half a full one, and tapping the current value clears it.
     */
    onChange?: (rating: number | null) => void;
    size?: number;
    /** Another character in place of ★, such as ● for energy dots. */
    glyph?: string;
    /** Spoken unit, singular and plural. */
    unit?: [string, string];
    emptyLabel?: string;
}

/**
 * Five stars. Each is a faint star with an accent one on top, clipped to the
 * filled part. The web symbol font has no filled star, so these are plain
 * characters.
 */
export function Stars({
    rating,
    onChange,
    size = 18,
    glyph: char = '★',
    unit = ['stella', 'stelle'],
    emptyLabel = 'Nessun voto',
}: StarsProps) {
    const theme = useTheme();
    const glyph = { fontSize: size, lineHeight: Math.round(size * 1.2) };
    const value = rating ?? 0;
    const spoken = (half: number) =>
        `${String(half / 2).replace('.', ',')} ${half === 2 ? unit[0] : unit[1]} su 5`;

    return (
        <View
            style={styles.row}
            accessible={!onChange}
            accessibilityLabel={rating ? spoken(rating) : emptyLabel}>
            {[1, 2, 3, 4, 5].map((star) => {
                const filled = Math.min(Math.max(value - star * 2 + 2, 0), 2);
                return (
                    <View key={star}>
                        <ThemedText style={[glyph, { color: theme.border }]}>
                            {char}
                        </ThemedText>
                        <View
                            style={[styles.fill, { width: `${filled * 50}%` }]}>
                            <ThemedText
                                style={[glyph, { color: theme.accent }]}>
                                {char}
                            </ThemedText>
                        </View>
                        {onChange &&
                            ([star * 2 - 1, star * 2] as const).map((half) => (
                                <Pressable
                                    key={half}
                                    onPress={() =>
                                        onChange(half === rating ? null : half)
                                    }
                                    accessibilityRole="button"
                                    accessibilityLabel={spoken(half)}
                                    accessibilityState={{
                                        selected: half === rating,
                                    }}
                                    style={[
                                        styles.half,
                                        half % 2 === 1
                                            ? styles.left
                                            : styles.right,
                                    ]}
                                />
                            ))}
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
    },
    fill: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        overflow: 'hidden',
    },
    half: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: '50%',
    },
    left: {
        left: 0,
    },
    right: {
        right: 0,
    },
});
