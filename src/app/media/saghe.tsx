import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    AddButton,
    ListColumn,
    ListRow,
    Secondary,
    listPage,
} from '@/components/list-column';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useSagas, type Saga } from '@/hooks/use-sagas';
import { useTheme } from '@/hooks/use-theme';
import { EpisodeDots } from '@/media/episode-dots';
import { SAGA_HEADERS, SagaForm } from '@/media/saga-form';
import { orderSagas } from '@/media/sagas';
import { SectionToggle } from '@/media/section-toggle';

/** The sagas to read or waiting for a release, then the archived ones. */
export default function Saghe() {
    const theme = useTheme();
    const router = useRouter();
    const isDesktop = useIsDesktop();
    const params = useLocalSearchParams<{ id?: string }>();
    const { sagas, error, reload, drop, put, mark } = useSagas();
    // Unset until tapped: the section then follows the selected saga.
    const [archiveOpen, setArchiveOpen] = useState<boolean>();

    // On desktop a row selects the saga for the panel beside the list; on the
    // phone it opens the form. Without an id it starts a new saga.
    const select = (id?: string) => {
        if (isDesktop) {
            router.setParams({ id });
        } else {
            router.push({ pathname: '/media/saga', params: id ? { id } : {} });
        }
    };

    const active = orderSagas(sagas?.filter((s) => !s.archivedAt) ?? []);
    const archived = orderSagas(sagas?.filter((s) => s.archivedAt) ?? []);
    const showArchive = archiveOpen ?? archived.some((s) => s.id === params.id);

    const add = <AddButton onPress={() => select()} />;

    const row = (saga: Saga, onMark?: typeof mark) => (
        <SagaRow
            key={saga.id}
            saga={saga}
            selected={saga.id === params.id}
            onPress={() => select(saga.id)}
            onMark={onMark}
        />
    );

    const list = (
        <>
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
                <ScrollView
                    contentContainerStyle={
                        isDesktop
                            ? [listPage.list, styles.sections]
                            : styles.list
                    }>
                    {!isDesktop && add}
                    {sagas?.length === 0 && (
                        <ThemedText
                            themeColor="textMuted"
                            style={styles.message}>
                            Ancora nessuna saga.
                        </ThemedText>
                    )}
                    {active.length > 0 && (
                        <View style={styles.section}>
                            {active.map((saga) => row(saga, mark))}
                        </View>
                    )}
                    {archived.length > 0 && (
                        <View style={styles.section}>
                            <SectionToggle
                                label="Archiviate"
                                count={archived.length}
                                open={showArchive}
                                onPress={() => setArchiveOpen(!showArchive)}
                            />
                            {showArchive && archived.map((saga) => row(saga))}
                        </View>
                    )}
                </ScrollView>
            )}
        </>
    );

    if (isDesktop) {
        return (
            <ThemedView style={listPage.page}>
                <ListColumn
                    title="Saghe"
                    link={{
                        label: 'Libri',
                        onPress: () => router.navigate('/media'),
                    }}
                    header={add}>
                    {list}
                </ListColumn>
                <View style={styles.grow}>
                    {/* The key starts a fresh form whenever the selection changes. */}
                    <SagaForm
                        key={params.id ?? 'new'}
                        id={params.id}
                        title={params.id ? SAGA_HEADERS.edit : SAGA_HEADERS.add}
                        onSaved={(saga) => {
                            put(saga);
                            reload();
                            select(saga.id);
                        }}
                        onDeleted={() => {
                            if (params.id) drop(params.id);
                            reload();
                            select();
                        }}
                        style={listPage.panel}
                    />
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader title="Saghe" backTo="/media" />
                {list}
            </SafeAreaView>
        </ThemedView>
    );
}

function SagaRow({
    saga,
    selected,
    onPress,
    onMark,
}: {
    saga: Saga;
    selected: boolean;
    onPress: () => void;
    /** Left out on archived rows, which have no dots. */
    onMark?: (saga: Saga, volume: number) => void;
}) {
    const details = [
        saga.author,
        saga.nextRelease && `esce ${saga.nextRelease}`,
    ].filter(Boolean);

    return (
        <ListRow selected={selected} onPress={onPress}>
            <View style={styles.grow}>
                <ThemedText themeColor={selected ? 'onAccent' : 'text'}>
                    {saga.name}
                </ThemedText>
                {details.length > 0 && (
                    <Secondary selected={selected} small>
                        {details.join(' · ')}
                    </Secondary>
                )}
                {onMark && (
                    <EpisodeDots
                        label="Volume"
                        episodes={saga.volumes}
                        watched={saga.volumesRead}
                        onAccent={selected}
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
    sections: {
        gap: Spacing.four,
    },
    section: {
        gap: Spacing.two,
    },
    grow: {
        flex: 1,
    },
});
