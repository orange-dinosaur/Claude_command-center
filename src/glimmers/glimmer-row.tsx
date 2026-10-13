import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { GlimmerSheet } from '@/glimmers/glimmer-sheet';
import { formatMoment } from '@/glimmers/months';
import type { Glimmer } from '@/hooks/use-glimmers';

interface GlimmerRowProps {
    glimmer: Glimmer;
    onEdit: (changes: Pick<Glimmer, 'text' | 'happenedAt'>) => void;
    onRemove: () => void;
}

export function GlimmerRow({ glimmer, onEdit, onRemove }: GlimmerRowProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Pressable
                onPress={() => setOpen(true)}
                // Not saved yet, so there is nothing to change on the server.
                disabled={glimmer.id.startsWith('new-')}
                accessibilityRole="button"
                accessibilityHint="Modifica"
                style={({ pressed }) => [
                    styles.row,
                    pressed && styles.pressed,
                ]}>
                <ThemedText themeColor="accent">✦</ThemedText>
                <View style={styles.grow}>
                    <ThemedText>{glimmer.text}</ThemedText>
                    <ThemedText type="small" themeColor="textMuted">
                        {formatMoment(glimmer.happenedAt)}
                    </ThemedText>
                </View>
            </Pressable>
            {open && (
                <GlimmerSheet
                    glimmer={glimmer}
                    onSave={onEdit}
                    onRemove={onRemove}
                    onClose={() => setOpen(false)}
                />
            )}
        </>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: Spacing.two,
    },
    pressed: {
        opacity: 0.6,
    },
    grow: {
        flex: 1,
    },
});
