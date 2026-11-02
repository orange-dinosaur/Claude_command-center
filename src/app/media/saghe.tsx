import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddButton, ListRow, Secondary } from '@/components/list-column';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useSagas, type Saga } from '@/hooks/use-sagas';
import { useTheme } from '@/hooks/use-theme';
import { EpisodeDots } from '@/media/episode-dots';
import { orderSagas } from '@/media/sagas';
import { SectionToggle } from '@/media/section-toggle';

/** The sagas to read or waiting for a release, then the archived ones. */
export default function Saghe() {
    const theme = useTheme();
    const router = useRouter();
    const { sagas, error, mark } = useSagas();
    const [archiveOpen, setArchiveOpen] = useState(false);

    const select = (id?: string) =>
        router.push({ pathname: '/media/saga', params: id ? { id } : {} });

    const active = orderSagas(sagas?.filter((s) => !s.archivedAt) ?? []);
    const archived = orderSagas(sagas?.filter((s) => s.archivedAt) ?? []);

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader title="Saghe" backTo="/media" />
                {error && (
                    <ThemedText
                        type="small"
                        themeColor="danger"
                        style={styles.message}>
                        {error}
                    </ThemedText>
                )}
                {sagas === undefined ? (
                    <ActivityIndicator
                        color={theme.textMuted}
                        style={styles.message}
                    />
                ) : (
                    <ScrollView contentContainerStyle={styles.list}>
                        <AddButton onPress={() => select()} />
                        {sagas?.length === 0 && (
                            <ThemedText
                                themeColor="textMuted"
                                style={styles.message}>
                                Ancora nessuna saga.
                            </ThemedText>
                        )}
                        {active.length > 0 && (
                            <View style={styles.section}>
                                {active.map((saga) => (
                                    <SagaRow
                                        key={saga.id}
                                        saga={saga}
                                        onPress={() => select(saga.id)}
                                        onMark={mark}
                                    />
                                ))}
                            </View>
                        )}
                        {archived.length > 0 && (
                            <View style={styles.section}>
                                <SectionToggle
                                    label="Archiviate"
                                    count={archived.length}
                                    open={archiveOpen}
                                    onPress={() => setArchiveOpen((o) => !o)}
                                />
                                {archiveOpen &&
                                    archived.map((saga) => (
                                        <SagaRow
                                            key={saga.id}
                                            saga={saga}
                                            onPress={() => select(saga.id)}
                                        />
                                    ))}
                            </View>
                        )}
                    </ScrollView>
                )}
            </SafeAreaView>
        </ThemedView>
    );
}

function SagaRow({
    saga,
    onPress,
    onMark,
}: {
    saga: Saga;
    onPress: () => void;
    /** Left out on archived rows, which have no dots. */
    onMark?: (saga: Saga, volume: number) => void;
}) {
    const details = [
        saga.author,
        saga.nextRelease && `esce ${saga.nextRelease}`,
    ].filter(Boolean);

    return (
        <ListRow onPress={onPress}>
            <View style={styles.grow}>
                <ThemedText>{saga.name}</ThemedText>
                {details.length > 0 && (
                    <Secondary selected={false} small>
                        {details.join(' · ')}
                    </Secondary>
                )}
                {onMark && (
                    <EpisodeDots
                        label="Volume"
                        episodes={saga.volumes}
                        watched={saga.volumesRead}
                        onPress={(volume) => onMark(saga, volume)}
                    />
                )}
            </View>
        </ListRow>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    message: {
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.three,
        textAlign: 'center',
    },
    list: {
        padding: Spacing.four,
        gap: Spacing.four,
    },
    section: {
        gap: Spacing.two,
    },
    grow: {
        flex: 1,
    },
});
