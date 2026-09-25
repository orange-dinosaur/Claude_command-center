import { useRouter } from 'expo-router';
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
import {
    INTENT_LABELS,
    weekOf,
    weeksBegun,
    weekStart,
} from '@/creativity/cycle';
import { THEMES } from '@/creativity/themes';
import { addDays, formatDay, formatShortDay, todayDay } from '@/dates';
import { useCurrentCycle, type CycleWithWeeks } from '@/hooks/use-cycles';
import { useTheme } from '@/hooks/use-theme';

function cycleState(cycle: CycleWithWeeks, today: string): string {
    if (cycle.interruptedOn) {
        const week = weeksBegun(cycle.startDate, cycle.interruptedOn);
        return `Interrotto alla settimana ${week}`;
    }
    if (today < cycle.startDate)
        return `Inizia il ${formatDay(cycle.startDate)}`;
    if (today > cycle.endDate) return 'Concluso';
    return 'In corso';
}

export default function Creativita() {
    const theme = useTheme();
    const { cycle, error } = useCurrentCycle();

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader title="Creatività" backTo="/command-center" />

                {error && (
                    <ThemedText
                        type="small"
                        themeColor="danger"
                        style={styles.message}>
                        {error}
                    </ThemedText>
                )}

                {cycle === undefined ? (
                    <ActivityIndicator
                        color={theme.textMuted}
                        style={styles.message}
                    />
                ) : cycle === null ? (
                    <View style={styles.list}>
                        <NewCycleButton />
                        <ThemedText
                            themeColor="textMuted"
                            style={styles.message}>
                            Ancora nessun ciclo.
                        </ThemedText>
                    </View>
                ) : (
                    <CycleView cycle={cycle} />
                )}
            </SafeAreaView>
        </ThemedView>
    );
}

function NewCycleButton() {
    const theme = useTheme();
    const router = useRouter();

    return (
        <Pressable
            onPress={() => router.push('/creativita/ciclo')}
            accessibilityRole="button"
            style={({ pressed }) => [
                styles.addButton,
                { backgroundColor: theme.accent },
                pressed && styles.pressed,
            ]}>
            <ThemedText style={[styles.buttonText, { color: theme.onAccent }]}>
                Nuovo ciclo
            </ThemedText>
        </Pressable>
    );
}

function CycleView({ cycle }: { cycle: CycleWithWeeks }) {
    const theme = useTheme();
    const router = useRouter();
    const today = todayDay();

    const weekCount = cycle.interruptedOn
        ? weeksBegun(cycle.startDate, cycle.interruptedOn)
        : 12;
    const current = cycle.interruptedOn ? null : weekOf(cycle.startDate, today);
    const intents = (
        Object.keys(INTENT_LABELS) as (keyof typeof INTENT_LABELS)[]
    ).filter((key) => cycle[key]);

    return (
        <ScrollView contentContainerStyle={styles.list}>
            {(cycle.interruptedOn || today > cycle.endDate) && (
                <NewCycleButton />
            )}
            <View>
                <ThemedText type="subtitle">
                    {formatDay(cycle.startDate)} – {formatDay(cycle.endDate)}
                </ThemedText>
                <View style={styles.stateRow}>
                    <ThemedText themeColor="textMuted" style={styles.grow}>
                        {cycleState(cycle, today)}
                    </ThemedText>
                    <Pressable
                        onPress={() =>
                            router.push({
                                pathname: '/creativita/ciclo',
                                params: { id: cycle.id },
                            })
                        }
                        accessibilityRole="button"
                        hitSlop={Spacing.two}
                        style={({ pressed }) => pressed && styles.pressed}>
                        <ThemedText themeColor="accent">Modifica</ThemedText>
                    </Pressable>
                </View>
            </View>

            {intents.map((key) => (
                <View key={key}>
                    <ThemedText type="small" themeColor="textMuted">
                        {INTENT_LABELS[key]}
                    </ThemedText>
                    <ThemedText>{cycle[key]}</ThemedText>
                </View>
            ))}

            <View style={styles.weeks}>
                {THEMES.slice(0, weekCount).map((t, i) => {
                    const week = i + 1;
                    const saved = cycle.weeks.find((w) => w.week === week);
                    const days = saved?.dailyPages.filter(Boolean).length ?? 0;
                    const start = weekStart(cycle.startDate, week);
                    return (
                        <View
                            key={week}
                            style={[
                                styles.row,
                                { backgroundColor: theme.backgroundElement },
                                week === current && {
                                    borderColor: theme.accent,
                                },
                            ]}>
                            <View style={styles.grow}>
                                <ThemedText>
                                    Settimana {week} · {t.title}
                                </ThemedText>
                                <ThemedText type="small" themeColor="textMuted">
                                    {formatShortDay(start)} –{' '}
                                    {formatShortDay(addDays(start, 6))}
                                </ThemedText>
                            </View>
                            <ThemedText
                                themeColor="textMuted"
                                accessibilityLabel={`Daily Pages ${days} su 7`}>
                                {days}/7
                            </ThemedText>
                            {saved?.reviewed ? (
                                <ThemedText
                                    style={[
                                        styles.check,
                                        { color: theme.accent },
                                    ]}
                                    accessibilityLabel="Rivista">
                                    ✓
                                </ThemedText>
                            ) : (
                                <View style={styles.check} />
                            )}
                        </View>
                    );
                })}
            </View>
        </ScrollView>
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
        gap: Spacing.three,
    },
    weeks: {
        gap: Spacing.two,
        marginTop: Spacing.two,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.three,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    grow: {
        flex: 1,
    },
    check: {
        width: 18,
        textAlign: 'center',
    },
    stateRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pressed: {
        opacity: 0.6,
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
