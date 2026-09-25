import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    Pressable,
    StyleSheet,
    View,
    type ViewStyle,
} from 'react-native';

import { apiUrl } from '@/auth/client';
import { Sheet } from '@/components/sheet';
import { ThemedText } from '@/components/themed-text';
import { Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useVisionBoard } from '@/hooks/use-vision-board';

/**
 * Safari shows its own save/share menu on a long-pressed image. Both
 * properties are inherited, so setting them here reaches the <img>.
 */
const noCallout = Platform.select({
    web: { WebkitTouchCallout: 'none', userSelect: 'none' } as ViewStyle,
});

export function VisionBoard() {
    const theme = useTheme();
    const { image, busy, error, choose, remove } = useVisionBoard();
    const [menu, setMenu] = useState<'closed' | 'actions' | 'confirm'>(
        'closed'
    );

    const close = () => setMenu('closed');

    if (image === undefined) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={theme.textMuted} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {image ? (
                <Pressable
                    onLongPress={() => setMenu('actions')}
                    accessibilityLabel="Vision board. Tieni premuto per modificarla."
                    style={[styles.fill, noCallout]}>
                    <Image
                        source={{ uri: apiUrl(image) }}
                        contentFit="contain"
                        style={styles.fill}
                        accessibilityIgnoresInvertColors
                    />
                </Pressable>
            ) : (
                <Pressable
                    onPress={choose}
                    disabled={busy}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                        styles.empty,
                        { borderColor: theme.textMuted },
                        pressed && styles.pressed,
                    ]}>
                    <SymbolView
                        name={{
                            ios: 'photo.badge.plus',
                            android: 'add_photo_alternate',
                            web: 'add_photo_alternate',
                        }}
                        tintColor={theme.accent}
                        size={32}
                        style={styles.emptyIcon}
                    />
                    <ThemedText themeColor="textMuted">
                        Carica la tua vision board
                    </ThemedText>
                </Pressable>
            )}

            {busy && (
                <View style={styles.overlay}>
                    <ActivityIndicator color={theme.accent} size="large" />
                </View>
            )}

            {error && (
                <ThemedText
                    type="small"
                    themeColor="danger"
                    style={styles.error}>
                    {error}
                </ThemedText>
            )}

            <Sheet visible={menu !== 'closed'} onClose={close}>
                {menu === 'actions' ? (
                    <>
                        <SheetButton
                            title="Sostituisci"
                            first
                            onPress={() => {
                                close();
                                choose();
                            }}
                        />
                        <SheetButton
                            title="Rimuovi"
                            color="danger"
                            onPress={() => setMenu('confirm')}
                        />
                    </>
                ) : (
                    <>
                        <ThemedText type="subtitle" style={styles.sheetTitle}>
                            Rimuovere la vision board?
                        </ThemedText>
                        <SheetButton
                            title="Rimuovi"
                            color="danger"
                            first
                            onPress={() => {
                                close();
                                remove();
                            }}
                        />
                    </>
                )}
                <SheetButton title="Annulla" color="text" onPress={close} />
            </Sheet>
        </View>
    );
}

function SheetButton({
    title,
    onPress,
    color = 'accent',
    first,
}: {
    title: string;
    onPress: () => void;
    color?: ThemeColor;
    first?: boolean;
}) {
    const theme = useTheme();

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            style={({ pressed }) => [
                styles.sheetButton,
                !first && {
                    borderTopWidth: 1,
                    borderTopColor: theme.border,
                },
                pressed && styles.pressed,
            ]}>
            <ThemedText themeColor={color}>{title}</ThemedText>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: Spacing.four,
        paddingBottom: Spacing.four,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fill: {
        flex: 1,
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderRadius: 20,
    },
    emptyIcon: {
        marginBottom: Spacing.two,
    },
    pressed: {
        opacity: 0.6,
    },
    overlay: {
        ...StyleSheet.absoluteFill,
        alignItems: 'center',
        justifyContent: 'center',
    },
    error: {
        paddingTop: Spacing.two,
        textAlign: 'center',
    },
    sheetTitle: {
        textAlign: 'center',
        paddingVertical: Spacing.three,
    },
    sheetButton: {
        alignItems: 'center',
        paddingVertical: Spacing.three,
    },
});
