import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { SetupChecklist } from '@/components/setup-checklist';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
    ANSWER_LABELS,
    cycleState,
    weekOf,
    weeksBegun,
    weekStart,
} from '@/creativity/cycle';
import { DesktopCreativita } from '@/creativity/desktop-page';
import { THEMES } from '@/creativity/themes';
import { addDays, formatDayRange, formatShortDay, todayDay } from '@/dates';
import { useCycle, type CycleWithWeeks } from '@/hooks/use-cycles';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useTheme } from '@/hooks/use-theme';

export default function Creativita() {
    return useIsDesktop() ? <DesktopCreativita /> : <PhoneCreativita />;
}

function PhoneCreativita() {
    const theme = useTheme();
    // With an id this shows a past cycle, opened from the list.
    const { id } = useLocalSearchParams<{ id?: string }>();
    const { cycle, error } = useCycle(id);

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader
                    title="Creatività"
                    backTo={id ? '/creativita/cicli' : '/command-center'}
                />

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
                    !id && (
                        <View style={styles.list}>
                            <NewCycleButton />
                            <ThemedText
                                themeColor="textMuted"
                                style={styles.message}>
                                Ancora nessun ciclo.
                            </ThemedText>
                        </View>
                    )
                ) : (
                    <CycleView cycle={cycle} past={!!id} />
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

function CycleView({ cycle, past }: { cycle: CycleWithWeeks; past: boolean }) {
    const theme = useTheme();
    const router = useRouter();
    const today = todayDay();

    const weekCount = cycle.interruptedOn
        ? weeksBegun(cycle.startDate, cycle.interruptedOn)
        : 12;
    const current = cycle.interruptedOn ? null : weekOf(cycle.startDate, today);
    const answers = (
        Object.keys(ANSWER_LABELS) as (keyof typeof ANSWER_LABELS)[]
    ).filter((key) => cycle[key]);

    return (
        <ScrollView contentContainerStyle={styles.list}>
            {!past && (cycle.interruptedOn || today > cycle.endDate) && (
                <NewCycleButton />
            )}
            <View>
                <ThemedText type="subtitle">
                    {formatDayRange(cycle.startDate, cycle.endDate)}
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

            {answers.map((key) => (
                <View key={key}>
                    <ThemedText type="small" themeColor="textMuted">
                        {ANSWER_LABELS[key]}
                    </ThemedText>
                    <ThemedText>{cycle[key]}</ThemedText>
                </View>
            ))}

            <SetupChecklist key={`${cycle.id}:${cycle.setup}`} cycle={cycle} />

            <View style={styles.weeks}>
                {THEMES.slice(0, weekCount).map((t, i) => {
                    const week = i + 1;
                    const saved = cycle.weeks.find((w) => w.week === week);
                    const days = saved?.dailyPages.filter(Boolean).length ?? 0;
                    const start = weekStart(cycle.startDate, week);
                    return (
                        <Pressable
                            key={week}
                            onPress={() =>
                                router.push({
                                    pathname: '/creativita/settimana',
                                    params: { cycle: cycle.id, week },
                                })
                            }
                            accessibilityRole="button"
                            style={({ pressed }) => [
                                styles.row,
                                { backgroundColor: theme.backgroundElement },
                                week === current && {
                                    borderColor: theme.accent,
                                },
                                pressed && styles.pressed,
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
                        </Pressable>
                    );
                })}
                <Pressable
                    onPress={() =>
                        router.push({
                            pathname: '/creativita/revisione',
                            params: { cycle: cycle.id },
                        })
                    }
                    accessibilityRole="button"
                    style={({ pressed }) => [
                        styles.row,
                        { backgroundColor: theme.backgroundElement },
                        pressed && styles.pressed,
                    ]}>
                    <ThemedText>Closing review</ThemedText>
                </Pressable>
            </View>

            {!past && (
                <Pressable
                    onPress={() => router.push('/creativita/cicli')}
                    accessibilityRole="link"
                    hitSlop={Spacing.two}
                    style={({ pressed }) => [
                        styles.pastLink,
                        pressed && styles.pressed,
                    ]}>
                    <ThemedText themeColor="accent">Cicli passati</ThemedText>
                </Pressable>
            )}
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
    pastLink: {
        alignSelf: 'center',
        marginTop: Spacing.two,
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
