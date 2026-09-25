import { useRouter } from 'expo-router';
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
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { formatShortDay, todayDay } from '@/dates';
import { useTheme } from '@/hooks/use-theme';
import { useWorkouts, type Workout } from '@/hooks/use-sport';
import { countWorkouts, formatMonth, groupByMonth } from '@/sport/riepilogo';

export default function Sport() {
    const theme = useTheme();
    const router = useRouter();
    const { workouts, error } = useWorkouts();
    const today = todayDay();
    const [open, setOpen] = useState(() => new Set([today.slice(0, 7)]));

    const toggle = (month: string) =>
        setOpen((current) => {
            const next = new Set(current);
            if (!next.delete(month)) next.add(month);
            return next;
        });

    const counts = countWorkouts(workouts ?? [], today);

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader
                    title="Sport"
                    backTo="/command-center"
                    link={{ label: 'Tipi', href: '/sport/tipi' }}
                />

                {error && (
                    <ThemedText
                        type="small"
                        themeColor="danger"
                        style={styles.message}>
                        {error}
                    </ThemedText>
                )}

                {workouts === undefined ? (
                    <ActivityIndicator
                        color={theme.textMuted}
                        style={styles.message}
                    />
                ) : (
                    <ScrollView contentContainerStyle={styles.list}>
                        <View style={styles.tiles}>
                            <Tile value={counts.week} label="Settimana" />
                            <Tile value={counts.month} label="Mese" />
                        </View>

                        <Pressable
                            onPress={() => router.push('/sport/allenamento')}
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
                                Registra allenamento
                            </ThemedText>
                        </Pressable>

                        {groupByMonth(workouts, today).map((group) => {
                            const isOpen = open.has(group.month);
                            return (
                                <View key={group.month} style={styles.group}>
                                    <Pressable
                                        onPress={() => toggle(group.month)}
                                        accessibilityRole="button"
                                        accessibilityState={{
                                            expanded: isOpen,
                                        }}
                                        style={({ pressed }) => [
                                            styles.monthHeader,
                                            pressed && styles.pressed,
                                        ]}>
                                        <ThemedText
                                            type="subtitle"
                                            style={styles.grow}>
                                            {formatMonth(group.month)}
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
                                    {isOpen &&
                                        (group.workouts.length === 0 ? (
                                            <ThemedText
                                                themeColor="textMuted"
                                                style={styles.message}>
                                                Nessun allenamento
                                            </ThemedText>
                                        ) : (
                                            group.workouts.map((w) => (
                                                <WorkoutRow
                                                    key={w.id}
                                                    workout={w}
                                                />
                                            ))
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

function Tile({ value, label }: { value: number; label: string }) {
    const theme = useTheme();

    return (
        <View
            style={[styles.tile, { backgroundColor: theme.backgroundElement }]}>
            {/* Karla: Cormorant's old-style 1 reads as an I. */}
            <ThemedText style={styles.count}>{value}</ThemedText>
            <ThemedText type="small" themeColor="textMuted">
                {label}
            </ThemedText>
        </View>
    );
}

function WorkoutRow({ workout }: { workout: Workout }) {
    const theme = useTheme();
    const router = useRouter();

    return (
        <Pressable
            onPress={() =>
                router.push({
                    pathname: '/sport/allenamento',
                    params: { id: workout.id },
                })
            }
            accessibilityRole="button"
            style={({ pressed }) => [
                styles.row,
                { backgroundColor: theme.backgroundElement },
                pressed && styles.pressed,
            ]}>
            <View style={styles.grow}>
                <ThemedText>{workout.typeName}</ThemedText>
                {workout.note && (
                    <ThemedText
                        type="small"
                        themeColor="textMuted"
                        numberOfLines={1}>
                        {workout.note}
                    </ThemedText>
                )}
            </View>
            <View style={styles.dates}>
                <ThemedText type="small" themeColor="textMuted">
                    {formatShortDay(workout.date)}
                </ThemedText>
                {workout.minutes !== null && (
                    <ThemedText type="small" themeColor="textMuted">
                        {workout.minutes} min
                    </ThemedText>
                )}
            </View>
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
        gap: Spacing.two,
    },
    tiles: {
        flexDirection: 'row',
        gap: Spacing.two,
    },
    tile: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing.three,
        borderRadius: 14,
    },
    count: {
        fontFamily: 'Karla_600SemiBold',
        fontSize: 32,
        lineHeight: 40,
    },
    addButton: {
        paddingVertical: Spacing.three,
        borderRadius: 14,
        alignItems: 'center',
        marginVertical: Spacing.two,
    },
    buttonText: {
        fontFamily: 'Karla_600SemiBold',
        fontSize: 18,
        lineHeight: 24,
    },
    pressed: {
        opacity: 0.6,
    },
    group: {
        gap: Spacing.two,
    },
    monthHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Spacing.three,
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
    dates: {
        alignItems: 'flex-end',
    },
});
