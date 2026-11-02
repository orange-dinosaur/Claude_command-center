import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Linking,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiFetch } from '@/auth/client';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useTheme } from '@/hooks/use-theme';
import { Cover } from '@/media/cover';
import type { Cover as Result } from '@/media/covers';

type Choice = {
    /** The cover in the form, not yet saved. */
    value: string | null;
    onChange: (cover: string | null) => void;
    /** What the search starts from: the title and author typed so far. */
    query: string;
    language: string;
};

/** The box in a form. Tapping it opens the window that picks a cover. */
export function CoverField(props: Choice) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Pressable
                onPress={() => setOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={
                    props.value ? 'Cambia copertina' : 'Cerca copertina'
                }>
                <Cover url={props.value} large />
                {!props.value && (
                    <View style={styles.hint}>
                        <ThemedText
                            type="small"
                            themeColor="textMuted"
                            style={styles.hintText}>
                            Cerca copertina
                        </ThemedText>
                    </View>
                )}
            </Pressable>
            {open && <Picker {...props} onClose={() => setOpen(false)} />}
        </>
    );
}

function useCoverSearch(query: string, language: string) {
    const [covers, setCovers] = useState<Result[] | null>(null);
    const [state, setState] = useState<'idle' | 'loading' | 'failed'>(
        query ? 'loading' : 'idle'
    );
    // Only the newest search may fill the grid.
    const latest = useRef(0);

    const load = useCallback(
        async (text: string) => {
            const request = ++latest.current;
            const params = new URLSearchParams({ q: text, language });
            const res = await apiFetch(`/api/covers/search?${params}`).catch(
                () => null
            );
            const body: { covers: Result[] } | null = res?.ok
                ? await res.json().catch(() => null)
                : null;

            if (request !== latest.current) return;
            setCovers(body?.covers ?? null);
            setState(body ? 'idle' : 'failed');
        },
        [language]
    );

    useEffect(() => {
        if (query) load(query);
    }, [query, load]);

    const search = (text: string) => {
        setState('loading');
        load(text);
    };

    return { covers, state, search };
}

function Picker({
    value,
    onChange,
    query,
    language,
    onClose,
}: Choice & { onClose: () => void }) {
    const theme = useTheme();
    const isDesktop = useIsDesktop();
    const [text, setText] = useState(query);
    const { covers, state, search } = useCoverSearch(query, language);

    const pick = (cover: string | null) => {
        onChange(cover);
        onClose();
    };
    const typed = text.trim();

    return (
        <Modal
            visible
            transparent={isDesktop}
            animationType={isDesktop ? 'fade' : 'slide'}
            onRequestClose={onClose}>
            <View style={isDesktop ? styles.backdrop : styles.fill}>
                <ThemedView style={isDesktop ? styles.panel : styles.fill}>
                    <SafeAreaView style={styles.fill}>
                        <View style={styles.header}>
                            <ThemedText type="title">Copertina</ThemedText>
                            <Pressable
                                onPress={onClose}
                                accessibilityRole="button"
                                hitSlop={8}>
                                <ThemedText themeColor="textMuted">
                                    Chiudi
                                </ThemedText>
                            </Pressable>
                        </View>

                        <View style={styles.search}>
                            <View style={styles.fill}>
                                <TextField
                                    label="Cerca"
                                    value={text}
                                    onChange={setText}
                                    placeholder="Titolo e autore"
                                />
                            </View>
                            <Pressable
                                onPress={() => search(typed)}
                                disabled={!typed}
                                accessibilityRole="button"
                                style={[
                                    styles.button,
                                    { backgroundColor: theme.accent },
                                ]}>
                                <ThemedText style={{ color: theme.onAccent }}>
                                    Cerca
                                </ThemedText>
                            </Pressable>
                        </View>
                        <ThemedText
                            type="small"
                            themeColor="textMuted"
                            style={styles.credit}>
                            powered by Google
                        </ThemedText>

                        <ScrollView contentContainerStyle={styles.results}>
                            {state === 'loading' && (
                                <ActivityIndicator color={theme.textMuted} />
                            )}
                            {state === 'failed' && (
                                <View style={styles.message}>
                                    <ThemedText themeColor="textMuted">
                                        Google non ha risposto.
                                    </ThemedText>
                                    <Pressable
                                        onPress={() => search(typed)}
                                        accessibilityRole="button"
                                        hitSlop={8}>
                                        <ThemedText>Riprova</ThemedText>
                                    </Pressable>
                                </View>
                            )}
                            {state === 'idle' && covers?.length === 0 && (
                                <ThemedText
                                    themeColor="textMuted"
                                    style={styles.center}>
                                    Nessun risultato.
                                </ThemedText>
                            )}
                            {state === 'idle' && !covers && (
                                <ThemedText
                                    themeColor="textMuted"
                                    style={styles.center}>
                                    Scrivi un titolo e cerca.
                                </ThemedText>
                            )}
                            {state === 'idle' && (
                                <View style={styles.grid}>
                                    {covers?.map((cover) => (
                                        <Item
                                            key={cover.url}
                                            cover={cover}
                                            wide={isDesktop}
                                            onPick={() => pick(cover.url)}
                                        />
                                    ))}
                                </View>
                            )}
                        </ScrollView>

                        {value && (
                            <Pressable
                                onPress={() => pick(null)}
                                accessibilityRole="button"
                                style={styles.remove}>
                                <ThemedText themeColor="textMuted">
                                    Rimuovi copertina
                                </ThemedText>
                            </Pressable>
                        )}
                    </SafeAreaView>
                </ThemedView>
            </View>
        </Modal>
    );
}

function Item({
    cover,
    wide,
    onPick,
}: {
    cover: Result;
    wide: boolean;
    onPick: () => void;
}) {
    const theme = useTheme();
    const { link } = cover;

    return (
        <View style={wide ? styles.itemWide : styles.item}>
            <Pressable
                onPress={onPick}
                accessibilityRole="button"
                accessibilityLabel={`Scegli ${cover.name}`}>
                <Image
                    source={{ uri: cover.url }}
                    contentFit="cover"
                    style={[styles.image, { backgroundColor: theme.border }]}
                    accessibilityIgnoresInvertColors
                />
                <ThemedText type="small" numberOfLines={2}>
                    {cover.name}
                </ThemedText>
                {cover.author && (
                    <ThemedText
                        type="small"
                        themeColor="textMuted"
                        numberOfLines={1}>
                        {cover.author}
                    </ThemedText>
                )}
            </Pressable>
            {link && (
                <Pressable
                    onPress={() => Linking.openURL(link)}
                    accessibilityRole="link"
                    hitSlop={4}>
                    <ThemedText
                        type="small"
                        themeColor="textMuted"
                        style={styles.link}>
                        Google Books
                    </ThemedText>
                </Pressable>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    fill: {
        flex: 1,
    },
    center: {
        textAlign: 'center',
    },
    hint: {
        ...StyleSheet.absoluteFill,
        justifyContent: 'center',
    },
    hintText: {
        fontSize: 11,
        lineHeight: 14,
        textAlign: 'center',
    },
    backdrop: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.four,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    panel: {
        width: '100%',
        maxWidth: 720,
        height: '100%',
        maxHeight: 720,
        borderRadius: 14,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.three,
    },
    search: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: Spacing.two,
        paddingHorizontal: Spacing.four,
    },
    button: {
        justifyContent: 'center',
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        borderRadius: 14,
    },
    credit: {
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.one,
    },
    results: {
        padding: Spacing.four,
    },
    message: {
        alignItems: 'center',
        gap: Spacing.two,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.two,
    },
    item: {
        width: '31%',
        gap: Spacing.half,
    },
    itemWide: {
        width: '18%',
        gap: Spacing.half,
    },
    image: {
        width: '100%',
        aspectRatio: 2 / 3,
        borderRadius: 4,
    },
    link: {
        textDecorationLine: 'underline',
    },
    remove: {
        alignItems: 'center',
        padding: Spacing.three,
    },
});
