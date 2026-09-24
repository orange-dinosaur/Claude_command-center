import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { TabBar } from '@/components/tab-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
    useTitles,
    type Kind,
    type Status,
    type Title,
} from '@/hooks/use-titles';

const TABS = ['Libri', 'Film', 'Serie'] as const;

type Tab = (typeof TABS)[number];

const KIND: Record<Tab, Kind> = {
    Libri: 'book',
    Film: 'film',
    Serie: 'series',
};

const READ = { doing: 'In lettura', todo: 'Da leggere', done: 'Letti' };
const WATCH = { doing: 'In visione', todo: 'Da vedere', done: 'Visti' };
const LABELS: Record<Kind, Record<Status, string>> = {
    book: READ,
    film: WATCH,
    series: WATCH,
};

const EMPTY: Record<Kind, string> = {
    book: 'Ancora nessun libro.',
    film: 'Ancora nessun film.',
    series: 'Ancora nessuna serie.',
};

export default function Media() {
    const theme = useTheme();
    const { titles, error } = useTitles();
    const [tab, setTab] = useState<Tab>('Libri');
    // Closed sections, keyed like "book-todo", open once tapped.
    const [open, setOpen] = useState<Record<string, boolean>>({});

    const kind = KIND[tab];
    const sections = titles?.[kind];

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader title="Media" backTo="/command-center" />
                <TabBar tabs={TABS} value={tab} onChange={setTab} />

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
                    <ScrollView contentContainerStyle={styles.list}>
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
                            const isOpen = status === 'doing' || open[key];
                            return (
                                <View key={status} style={styles.section}>
                                    {status === 'doing' ? (
                                        <ThemedText type="subtitle">
                                            {LABELS[kind][status]}
                                        </ThemedText>
                                    ) : (
                                        <Pressable
                                            onPress={() =>
                                                setOpen((o) => ({
                                                    ...o,
                                                    [key]: !o[key],
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
                                                {LABELS[kind][status]}
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
                                            <TitleRow key={t.id} title={t} />
                                        ))}
                                </View>
                            );
                        })}
                    </ScrollView>
                )}
            </SafeAreaView>
        </ThemedView>
    );
}

function TitleRow({ title }: { title: Title }) {
    const theme = useTheme();

    return (
        <View
            style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.grow}>
                <ThemedText>
                    {title.kind === 'series'
                        ? `${title.name} · Stagione ${title.season}`
                        : title.name}
                </ThemedText>
                {title.author && (
                    <ThemedText type="small" themeColor="textMuted">
                        {title.author}
                    </ThemedText>
                )}
            </View>
            {title.rating !== null && <Stars rating={title.rating} />}
        </View>
    );
}

/**
 * Five stars for a rating in half stars, 1 to 10. Each is a faint star with
 * an accent one on top, clipped to the filled part. The web symbol font has
 * no filled star, so these are plain characters.
 */
function Stars({ rating }: { rating: number }) {
    const theme = useTheme();

    return (
        <View
            style={styles.stars}
            accessible
            accessibilityLabel={`${String(rating / 2).replace('.', ',')} stelle su 5`}>
            {[1, 2, 3, 4, 5].map((star) => {
                const filled = Math.min(Math.max(rating - star * 2 + 2, 0), 2);
                return (
                    <View key={star}>
                        <ThemedText
                            style={[styles.star, { color: theme.border }]}>
                            ★
                        </ThemedText>
                        <View
                            style={[
                                styles.starFill,
                                { width: `${filled * 50}%` },
                            ]}>
                            <ThemedText
                                style={[styles.star, { color: theme.accent }]}>
                                ★
                            </ThemedText>
                        </View>
                    </View>
                );
            })}
        </View>
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
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
    },
    pressed: {
        opacity: 0.6,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.three,
        borderRadius: 14,
    },
    grow: {
        flex: 1,
    },
    stars: {
        flexDirection: 'row',
    },
    star: {
        fontSize: 18,
        lineHeight: 22,
    },
    starFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        overflow: 'hidden',
    },
});
