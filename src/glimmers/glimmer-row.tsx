import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { formatMoment } from '@/glimmers/months';
import type { Glimmer } from '@/hooks/use-glimmers';

export function GlimmerRow({ glimmer }: { glimmer: Glimmer }) {
    return (
        <View style={styles.row}>
            <ThemedText themeColor="accent">✦</ThemedText>
            <View style={styles.grow}>
                <ThemedText>{glimmer.text}</ThemedText>
                <ThemedText type="small" themeColor="textMuted">
                    {formatMoment(glimmer.happenedAt)}
                </ThemedText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: Spacing.two,
    },
    grow: {
        flex: 1,
    },
});
