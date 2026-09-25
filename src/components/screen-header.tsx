import { useRouter, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ScreenHeaderProps {
    title: string;
    /** Where the back arrow leads when there is no history to go back to. */
    backTo?: Href;
    /** A text link at the right of the title. */
    link?: { label: string } & ({ href: Href } | { onPress: () => void });
}

/**
 * A screen can be opened straight from the address bar, so back needs a
 * fixed destination as well as the history.
 */
export function ScreenHeader({ title, backTo, link }: ScreenHeaderProps) {
    const theme = useTheme();
    const router = useRouter();

    return (
        <View style={styles.container}>
            {backTo && (
                <Pressable
                    onPress={() =>
                        router.canGoBack()
                            ? router.back()
                            : router.navigate(backTo)
                    }
                    accessibilityLabel="Indietro"
                    accessibilityRole="button"
                    hitSlop={Spacing.two}
                    style={({ pressed }) => [
                        styles.back,
                        pressed && styles.pressed,
                    ]}>
                    <SymbolView
                        name={{
                            ios: 'chevron.left',
                            android: 'chevron_left',
                            web: 'chevron_left',
                        }}
                        tintColor={theme.accent}
                        size={24}
                    />
                </Pressable>
            )}
            {link ? (
                <View style={styles.titleRow}>
                    <ThemedText type="title" style={styles.grow}>
                        {title}
                    </ThemedText>
                    <Pressable
                        onPress={() =>
                            'href' in link
                                ? router.push(link.href)
                                : link.onPress()
                        }
                        accessibilityRole={'href' in link ? 'link' : 'button'}
                        hitSlop={Spacing.two}
                        style={({ pressed }) => pressed && styles.pressed}>
                        <ThemedText style={{ color: theme.accent }}>
                            {link.label}
                        </ThemedText>
                    </Pressable>
                </View>
            ) : (
                <ThemedText type="title">{title}</ThemedText>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: Spacing.four,
        // Clears the blur iOS draws under the status bar in a home screen app.
        paddingTop: Spacing.five,
        paddingBottom: Spacing.three,
        gap: Spacing.two,
    },
    back: {
        alignSelf: 'flex-start',
        marginLeft: -Spacing.one,
    },
    pressed: {
        opacity: 0.6,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
    },
    grow: {
        flex: 1,
    },
});
