import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useSemaforo } from '@/hooks/use-semaforo';
import { useTheme } from '@/hooks/use-theme';
import { type Colour, COLOURS } from '@/semaforo/colours';
import { ColourList } from '@/semaforo/colour-list';

export default function SemaforoScreen() {
    const theme = useTheme();
    const isDesktop = useIsDesktop();
    const { items, error, add, remove } = useSemaforo();
    // Every colour opens each visit; closing one is not remembered.
    const [closed, setClosed] = useState<Partial<Record<Colour, boolean>>>({});

    const lists = COLOURS.map((colour) => (
        <View key={colour.key} style={isDesktop && styles.column}>
            <ColourList
                colour={colour}
                items={(items ?? []).filter((i) => i.colour === colour.key)}
                open={isDesktop ? undefined : !closed[colour.key]}
                onToggle={() =>
                    setClosed((c) => ({ ...c, [colour.key]: !c[colour.key] }))
                }
                onAdd={(name) => add(colour.key, name)}
                onRemove={remove}
            />
        </View>
    ));

    const body = (
        <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.body, isDesktop && styles.desktop]}>
            {isDesktop && <ThemedText type="title">Semaforo</ThemedText>}
            {error && (
                <ThemedText type="small" themeColor="danger">
                    {error}
                </ThemedText>
            )}
            {items === undefined ? (
                <ActivityIndicator color={theme.textMuted} />
            ) : isDesktop ? (
                <View style={styles.columns}>{lists}</View>
            ) : (
                lists
            )}
        </ScrollView>
    );

    if (isDesktop) {
        return <ThemedView style={styles.container}>{body}</ThemedView>;
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader title="Semaforo" backTo="/command-center" />
                {body}
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    body: {
        padding: Spacing.four,
        gap: Spacing.four,
    },
    desktop: {
        paddingTop: 32,
        paddingHorizontal: 40,
    },
    columns: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.four,
    },
    column: {
        flex: 1,
        minWidth: 0,
    },
});
