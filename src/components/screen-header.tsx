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
}

/**
 * A screen can be opened straight from the address bar, so back needs a
 * fixed destination as well as the history.
 */
export function ScreenHeader({ title, backTo }: ScreenHeaderProps) {
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
            <ThemedText type="title">{title}</ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.three,
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
});
