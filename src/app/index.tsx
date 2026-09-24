import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { VisionBoard } from '@/components/vision-board';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useToday } from '@/hooks/use-today';

export default function Home() {
    const theme = useTheme();
    const today = useToday();

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <View style={styles.dateRow}>
                    <ThemedText type="subtitle">{today}</ThemedText>
                    <Link href="/command-center" asChild>
                        <Pressable
                            accessibilityLabel="Command center"
                            hitSlop={Spacing.two}>
                            {({ pressed }) => (
                                <View style={pressed && styles.pressed}>
                                    <SymbolView
                                        name={{
                                            ios: 'square.grid.2x2',
                                            android: 'grid_view',
                                            web: 'grid_view',
                                        }}
                                        tintColor={theme.accent}
                                        size={28}
                                    />
                                </View>
                            )}
                        </Pressable>
                    </Link>
                </View>
                <VisionBoard />
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.four,
        // Clears the blur iOS draws under the status bar in a home screen app.
        paddingTop: Spacing.five,
        paddingBottom: Spacing.three,
    },
    pressed: {
        opacity: 0.6,
    },
});
