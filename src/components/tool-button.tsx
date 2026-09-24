import { Link, type Href } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ToolButtonProps {
    title: string;
    href: Href;
    icon: SymbolViewProps['name'];
}

export function ToolButton({ title, href, icon }: ToolButtonProps) {
    const theme = useTheme();

    return (
        <Link href={href} asChild>
            <Pressable style={styles.button}>
                {({ pressed }) => (
                    <View
                        style={[
                            styles.tile,
                            { backgroundColor: theme.backgroundElement },
                            pressed && styles.pressed,
                        ]}>
                        <SymbolView
                            name={icon}
                            tintColor={theme.accent}
                            size={32}
                        />
                        <ThemedText style={styles.title}>{title}</ThemedText>
                    </View>
                )}
            </Pressable>
        </Link>
    );
}

const styles = StyleSheet.create({
    button: {
        flexBasis: '47%',
        aspectRatio: 1,
    },
    tile: {
        flex: 1,
        borderRadius: 20,
        padding: Spacing.three,
        justifyContent: 'space-between',
    },
    pressed: {
        opacity: 0.6,
    },
    title: {
        fontFamily: 'Karla_600SemiBold',
    },
});
