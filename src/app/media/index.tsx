import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
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
import { Stars } from '@/components/stars';
import { TabBar } from '@/components/tab-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTitles, type Kind, type Title } from '@/hooks/use-titles';
import { STATUS_LABELS } from '@/media/labels';

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
                        <Pressable
                            onPress={() =>
                                router.push({
                                    pathname: '/media/titolo',
                                    params: { kind },
                                })
                            }
                            accessibilityRole="button"
                            style={({ pressed }) => [
                                styles.addButton,
                                { backgroundColor: theme.accent },
                                pressed && styles.pressed,
                            ]}>
                            <ThemedText
                                style={[
                                    styles.buttonText,
                                    { color: theme.onAccent },
                                ]}>
                                Aggiungi
                            </ThemedText>
                        </Pressable>
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
                                            {STATUS_LABELS[kind][status]}
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
    const router = useRouter();

    return (
        <Pressable
            onPress={() =>
                router.push({
                    pathname: '/media/titolo',
                    params: { kind: title.kind, id: title.id },
                })
            }
            accessibilityRole="button"
            style={({ pressed }) => [
                styles.row,
                { backgroundColor: theme.backgroundElement },
                pressed && styles.pressed,
            ]}>
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
        </Pressable>
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
    addButton: {
        paddingVertical: Spacing.three,
        borderRadius: 14,
        alignItems: 'center',
    },
    buttonText: {
        fontFamily: 'Karla_600SemiBold',
        fontSize: 18,
        lineHeight: 24,
    },
});
