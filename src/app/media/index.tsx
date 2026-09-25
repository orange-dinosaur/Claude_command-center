import { SymbolView } from 'expo-symbols';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    AddButton,
    ListColumn,
    ListRow,
    Secondary,
    listPage,
} from '@/components/list-column';
import { ScreenHeader } from '@/components/screen-header';
import { Stars } from '@/components/stars';
import { TabBar } from '@/components/tab-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useTheme } from '@/hooks/use-theme';
import { useTitles, type Kind, type Title } from '@/hooks/use-titles';
import { STATUS_LABELS } from '@/media/labels';
import { TITLE_HEADERS, TitleForm, isKind } from '@/media/title-form';

const TABS = ['Libri', 'Film', 'Serie'] as const;

type Tab = (typeof TABS)[number];

const KIND: Record<Tab, Kind> = {
    Libri: 'book',
    Film: 'film',
    Serie: 'series',
};

const EMPTY: Record<Kind, string> = {
    book: 'Ancora nessun libro.',
    film: 'Ancora nessun film.',
    series: 'Ancora nessuna serie.',
};

export default function Media() {
    const theme = useTheme();
    const router = useRouter();
    const isDesktop = useIsDesktop();
    const params = useLocalSearchParams<{ kind?: string; id?: string }>();
    const { titles, error, reload, drop } = useTitles();
    // Open sections, keyed like "book-todo", closed until tapped.
    const [open, setOpen] = useState<Record<string, boolean>>({});

    const kind: Kind = isKind(params.kind) ? params.kind : 'book';
    const tab = TABS.find((t) => KIND[t] === kind) ?? 'Libri';
    const sections = titles?.[kind];

    // A section holding the selected title opens, and stays open after the
    // title is deleted, unless it was closed by hand.
    const holding =
        params.id &&
        (['todo', 'done'] as const).find((s) =>
            sections?.[s].some((t) => t.id === params.id)
        );
    if (holding && open[`${kind}-${holding}`] === undefined) {
        setOpen((o) => ({ ...o, [`${kind}-${holding}`]: true }));
    }

    // The kind lives in the URL, with books as the default.
    const setTab = (next: Tab) =>
        router.setParams({
            kind: next === 'Libri' ? undefined : KIND[next],
            id: undefined,
        });

    // On desktop a row selects the title for the panel beside the list; on
    // the phone it opens the form. Without an id it starts a new title.
    const select = (id?: string) => {
        if (isDesktop) {
            router.setParams({ id });
        } else {
            router.push({
                pathname: '/media/titolo',
                params: id ? { kind, id } : { kind },
            });
        }
    };

    // After a save the title stays selected; after a delete the panel
    // returns to the empty form.
    const saved = (id?: string) => {
        reload();
        select(id);
    };

    const tabBar = (
        <TabBar
            tabs={TABS}
            value={tab}
            onChange={setTab}
            style={isDesktop && styles.flush}
        />
    );

    const add = <AddButton onPress={() => select()} />;

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

            {sections === undefined ? (
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
                    {sections.doing.length +
                        sections.todo.length +
                        sections.done.length ===
                        0 && (
                        <ThemedText
                            themeColor="textMuted"
                            style={styles.message}>
                            {EMPTY[kind]}
                        </ThemedText>
                    )}
                    {(['doing', 'todo', 'done'] as const).map((status) => {
                        const rows = sections[status];
                        if (rows.length === 0) return null;
                        const key = `${kind}-${status}`;
                        const isOpen = status === 'doing' || !!open[key];
                        return (
                            <View key={status} style={styles.section}>
                                {status === 'doing' ? (
                                    <ThemedText type="subtitle">
                                        {STATUS_LABELS[kind][status]}
                                    </ThemedText>
                                ) : (
                                    <Pressable
                                        onPress={() =>
                                            setOpen((o) => ({
                                                ...o,
                                                [key]: !isOpen,
                                            }))
                                        }
                                        accessibilityRole="button"
                                        accessibilityState={{
                                            expanded: isOpen,
                                        }}
                                        style={({ pressed }) => [
                                            styles.sectionHeader,
                                            pressed && styles.pressed,
                                        ]}>
                                        <ThemedText
                                            type="subtitle"
                                            style={styles.grow}>
                                            {STATUS_LABELS[kind][status]}
                                        </ThemedText>
                                        <ThemedText themeColor="textMuted">
                                            {rows.length}
                                        </ThemedText>
                                        <SymbolView
                                            name={
                                                isOpen
                                                    ? {
                                                          ios: 'chevron.down',
                                                          android:
                                                              'expand_more',
                                                          web: 'expand_more',
                                                      }
                                                    : {
                                                          ios: 'chevron.right',
                                                          android:
                                                              'chevron_right',
                                                          web: 'chevron_right',
                                                      }
                                            }
                                            tintColor={theme.textMuted}
                                            size={24}
                                        />
                                    </Pressable>
                                )}
                                {isOpen &&
                                    rows.map((t) => (
                                        <TitleRow
                                            key={t.id}
                                            title={t}
                                            selected={t.id === params.id}
                                            onPress={() => select(t.id)}
                                        />
                                    ))}
                            </View>
                        );
                    })}
                </ScrollView>
            )}
        </>
    );

    if (isDesktop) {
        return (
            <ThemedView style={listPage.page}>
                <ListColumn
                    title="Media"
                    header={
                        <>
                            {tabBar}
                            {add}
                        </>
                    }>
                    {list}
                </ListColumn>
                <View style={styles.grow}>
                    {/* The key starts a fresh form whenever the selection changes. */}
                    <TitleForm
                        key={`${kind}-${params.id ?? 'new'}`}
                        kind={kind}
                        id={params.id}
                        title={
                            params.id
                                ? TITLE_HEADERS[kind].edit
                                : TITLE_HEADERS[kind].add
                        }
                        onSaved={saved}
                        onDeleted={() => {
                            if (params.id) drop(params.id);
                            saved();
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
                <ScreenHeader title="Media" backTo="/command-center" />
                {tabBar}
                {list}
            </SafeAreaView>
        </ThemedView>
    );
}

function TitleRow({
    title,
    selected,
    onPress,
}: {
    title: Title;
    selected: boolean;
    onPress: () => void;
}) {
    return (
        <ListRow selected={selected} onPress={onPress}>
            <View style={styles.grow}>
                <ThemedText themeColor={selected ? 'onAccent' : 'text'}>
                    {title.kind === 'series'
                        ? `${title.name} · Stagione ${title.season}`
                        : title.name}
                </ThemedText>
                {title.author && (
                    <Secondary selected={selected} small>
                        {title.author}
                    </Secondary>
                )}
            </View>
            {title.rating !== null && (
                <Stars rating={title.rating} onAccent={selected} />
            )}
        </ListRow>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    flush: {
        marginHorizontal: 0,
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
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
    },
    pressed: {
        opacity: 0.6,
    },
    grow: {
        flex: 1,
    },
});
