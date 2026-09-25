import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { VisionBoard } from '@/components/vision-board';
import { Spacing } from '@/constants/theme';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useTheme } from '@/hooks/use-theme';
import { useToday } from '@/hooks/use-today';

export default function Home() {
    const theme = useTheme();
    const today = useToday();
    const isDesktop = useIsDesktop();

    if (isDesktop) {
        // "giovedì 24 settembre": one word each for weekday, day and month.
        const [weekday, day, month] = today.split(' ');
        return (
            <ThemedView style={styles.container}>
                <VisionBoard
                    aside={
                        <View>
                            <ThemedText
                                themeColor="textMuted"
                                style={styles.weekday}>
                                {weekday}
                            </ThemedText>
                            <ThemedText style={styles.day}>{day}</ThemedText>
                            <ThemedText type="title" style={styles.month}>
                                {month}
                            </ThemedText>
                        </View>
                    }
                />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <View style={styles.dateRow}>
                    <ThemedText type="subtitle" style={styles.date}>
                        {today}
                    </ThemedText>
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
    date: {
        fontSize: 28,
        lineHeight: 32,
    },
    pressed: {
        opacity: 0.6,
    },
    weekday: {
        fontFamily: 'Karla_500Medium',
        fontSize: 14,
        lineHeight: 20,
        textTransform: 'capitalize',
    },
    day: {
        fontFamily: 'CormorantGaramond_600SemiBold',
        fontSize: 64,
        lineHeight: 64,
    },
    month: {
        textTransform: 'capitalize',
    },
});
