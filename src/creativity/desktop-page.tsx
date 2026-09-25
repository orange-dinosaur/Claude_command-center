/**
 * Creatività on desktop: the cycle's rows in the list column, and the
 * selected part of it (a week, Setup, the closing review, the cycle form or
 * the past cycles) in the panel beside it. The selection lives in the URL;
 * without one the panel shows what today calls for.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

import {
    AddButton,
    ListColumn,
    ListRow,
    Secondary,
    listPage,
} from '@/components/list-column';
import { SetupChecklist } from '@/components/setup-checklist';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { ClosingReview } from '@/creativity/closing-review';
import {
    ANSWER_LABELS,
    cycleState,
    weekOf,
    weeksBegun,
    weekStart,
} from '@/creativity/cycle';
import { CycleForm } from '@/creativity/cycle-form';
import { PastCycles } from '@/creativity/past-cycles';
import { THEMES } from '@/creativity/themes';
import { WeekView } from '@/creativity/week-view';
import { addDays, formatDayRange, formatShortDay, todayDay } from '@/dates';
import { useCycle, useCycles, type CycleWithWeeks } from '@/hooks/use-cycles';
import { useTheme } from '@/hooks/use-theme';

type Panel =
    | { kind: 'week'; week: number }
    | { kind: 'setup' | 'review' | 'edit' | 'past' | 'new' };

// Every panel parameter set to undefined, so setParams drops them all.
const CLEAR = {
    week: undefined,
    setup: undefined,
    review: undefined,
    edit: undefined,
    past: undefined,
    new: undefined,
};

type Selection = Partial<Record<keyof typeof CLEAR, string>>;

/** What the panel shows for the URL, or for today when the URL says nothing. */
function panelFor(
    params: Selection,
    cycle: CycleWithWeeks | null,
    past: boolean,
    today: string
): Panel {
    if (params.new || !cycle) return { kind: 'new' };
    if (params.past) return { kind: 'past' };
    if (params.edit) return { kind: 'edit' };
    if (params.review) return { kind: 'review' };
    if (params.setup) return { kind: 'setup' };
    if (params.week) return { kind: 'week', week: Number(params.week) };
    if (past || today < cycle.startDate) return { kind: 'setup' };
    if (cycle.interruptedOn || today > cycle.endDate) return { kind: 'review' };
    return { kind: 'week', week: weekOf(cycle.startDate, today) ?? 1 };
}

export function DesktopCreativita() {
    const theme = useTheme();
    const router = useRouter();
    const params = useLocalSearchParams<Selection & { id?: string }>();
    const { cycle, error, reload } = useCycle(params.id);
    const { cycles, reload: reloadCycles } = useCycles();
    const today = todayDay();

    // An id other than the newest cycle's opens a past cycle.
    const latestId = cycles?.[0]?.id;
    const past = Boolean(params.id && latestId && params.id !== latestId);

    const show = (next: Selection) => router.setParams({ ...CLEAR, ...next });
    const refresh = () => {
        reload();
        reloadCycles();
    };
    const backToCurrent = () => router.setParams({ ...CLEAR, id: undefined });

    if (cycle === undefined) {
        return (
            <ThemedView style={listPage.page}>
                <ActivityIndicator
                    color={theme.textMuted}
                    style={[styles.grow, styles.message]}
                />
            </ThemedView>
        );
    }

    const panel = panelFor(params, cycle, past, today);
    const over =
        cycle && (Boolean(cycle.interruptedOn) || today > cycle.endDate);

    const header = cycle ? (
        <>
            {past && (
                <Pressable
                    onPress={backToCurrent}
                    accessibilityRole="link"
                    style={({ pressed }) => pressed && styles.pressed}>
                    <ThemedText themeColor="accent">
                        ‹ Ciclo corrente
                    </ThemedText>
                </Pressable>
            )}
            {!past && over && (
                <AddButton
                    label="Nuovo ciclo"
                    onPress={() => show({ new: '1' })}
                />
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
                        onPress={() => show({ edit: '1' })}
                        accessibilityRole="button"
                        hitSlop={Spacing.two}
                        style={({ pressed }) => pressed && styles.pressed}>
                        <ThemedText themeColor="accent">Modifica</ThemedText>
                    </Pressable>
                </View>
            </View>
        </>
    ) : (
        <AddButton label="Nuovo ciclo" onPress={() => show({ new: '1' })} />
    );

    return (
        <ThemedView style={listPage.page}>
            <ListColumn title="Creatività" header={header}>
                {error && (
                    <ThemedText
                        type="small"
                        themeColor="danger"
                        style={styles.message}>
                        {error}
                    </ThemedText>
                )}
                {cycle ? (
                    <CycleRows
                        cycle={cycle}
                        panel={panel}
                        past={past}
                        today={today}
                        show={show}
                    />
                ) : (
                    <ThemedText themeColor="textMuted" style={styles.message}>
                        Ancora nessun ciclo.
                    </ThemedText>
                )}
            </ListColumn>

            <View style={styles.grow}>
                {panel.kind === 'new' && (
                    <CycleForm
                        key="new"
                        title="Nuovo ciclo"
                        onDone={() => {
                            refresh();
                            backToCurrent();
                        }}
                        style={listPage.panel}
                    />
                )}
                {cycle && panel.kind === 'edit' && (
                    <CycleForm
                        key={cycle.id}
                        id={cycle.id}
                        title="Modifica ciclo"
                        onDone={(deleted) => {
                            refresh();
                            if (deleted) backToCurrent();
                            else show({});
                        }}
                        style={listPage.panel}
                    />
                )}
                {panel.kind === 'past' && (
                    <PastCycles
                        title="Cicli passati"
                        onOpen={(id) => router.setParams({ ...CLEAR, id })}
                        style={listPage.panel}
                    />
                )}
                {cycle && panel.kind === 'setup' && (
                    <SetupPanel cycle={cycle} onChanged={reload} />
                )}
                {cycle && panel.kind === 'week' && (
                    <WeekView
                        key={`${cycle.id}-${panel.week}`}
                        cycleId={cycle.id}
                        number={panel.week}
                        onChanged={reload}
                        style={styles.widePanel}
                    />
                )}
                {cycle && panel.kind === 'review' && (
                    <ClosingReview
                        key={cycle.id}
                        cycleId={cycle.id}
                        title="Closing review"
                        style={styles.textPanel}
                    />
                )}
            </View>
        </ThemedView>
    );
}

function CycleRows({
    cycle,
    panel,
    past,
    today,
    show,
}: {
    cycle: CycleWithWeeks;
    panel: Panel;
    past: boolean;
    today: string;
    show: (next: Selection) => void;
}) {
    const theme = useTheme();

    const weekCount = cycle.interruptedOn
        ? weeksBegun(cycle.startDate, cycle.interruptedOn)
        : 12;
    const current = cycle.interruptedOn ? null : weekOf(cycle.startDate, today);
    const setupSelected = panel.kind === 'setup';
    const reviewSelected = panel.kind === 'review';

    return (
        <ScrollView contentContainerStyle={listPage.list}>
            <ListRow
                selected={setupSelected}
                onPress={() => show({ setup: '1' })}>
                <ThemedText
                    themeColor={setupSelected ? 'onAccent' : 'text'}
                    style={styles.grow}>
                    Setup
                </ThemedText>
                <Secondary selected={setupSelected}>
                    {cycle.setup.filter(Boolean).length}/4
                </Secondary>
            </ListRow>

            {THEMES.slice(0, weekCount).map((t, i) => {
                const week = i + 1;
                const selected = panel.kind === 'week' && panel.week === week;
                const saved = cycle.weeks.find((w) => w.week === week);
                const days = saved?.dailyPages.filter(Boolean).length ?? 0;
                const start = weekStart(cycle.startDate, week);
                return (
                    <ListRow
                        key={week}
                        selected={selected}
                        onPress={() => show({ week: String(week) })}
                        style={[
                            styles.weekRow,
                            week === current && { borderColor: theme.accent },
                        ]}>
                        <View style={styles.grow}>
                            <ThemedText
                                themeColor={selected ? 'onAccent' : 'text'}>
                                Settimana {week} · {t.title}
                            </ThemedText>
                            <Secondary selected={selected} small>
                                {formatShortDay(start)} –{' '}
                                {formatShortDay(addDays(start, 6))}
                            </Secondary>
                        </View>
                        <Secondary selected={selected}>{days}/7</Secondary>
                        <ThemedText
                            style={[
                                styles.check,
                                {
                                    color: selected
                                        ? theme.onAccent
                                        : theme.accent,
                                },
                            ]}
                            accessibilityLabel={
                                saved?.reviewed ? 'Rivista' : undefined
                            }>
                            {saved?.reviewed ? '✓' : ''}
                        </ThemedText>
                    </ListRow>
                );
            })}

            <ListRow
                selected={reviewSelected}
                onPress={() => show({ review: '1' })}>
                <ThemedText themeColor={reviewSelected ? 'onAccent' : 'text'}>
                    Closing review
                </ThemedText>
            </ListRow>

            {!past && (
                <Pressable
                    onPress={() => show({ past: '1' })}
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

/** The cycle's opening answers and its setup checklist. */
function SetupPanel({
    cycle,
    onChanged,
}: {
    cycle: CycleWithWeeks;
    onChanged: () => void;
}) {
    const answers = (
        Object.keys(ANSWER_LABELS) as (keyof typeof ANSWER_LABELS)[]
    ).filter((key) => cycle[key]);

    return (
        <ScrollView contentContainerStyle={[listPage.panel, styles.setup]}>
            <ThemedText type="title">Setup</ThemedText>
            {answers.map((key) => (
                <View key={key}>
                    <ThemedText type="small" themeColor="textMuted">
                        {ANSWER_LABELS[key]}
                    </ThemedText>
                    <ThemedText>{cycle[key]}</ThemedText>
                </View>
            ))}
            <SetupChecklist
                key={`${cycle.id}:${cycle.setup}`}
                cycle={cycle}
                onChanged={onChanged}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    message: {
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.three,
        textAlign: 'center',
    },
    grow: {
        flex: 1,
    },
    stateRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pressed: {
        opacity: 0.6,
    },
    weekRow: {
        borderWidth: 2,
        borderColor: 'transparent',
    },
    check: {
        width: 18,
        textAlign: 'center',
    },
    pastLink: {
        alignSelf: 'center',
        marginTop: Spacing.two,
    },
    setup: {
        gap: Spacing.three,
    },
    widePanel: {
        paddingVertical: 32,
        paddingHorizontal: 40,
    },
    textPanel: {
        paddingVertical: 32,
        paddingHorizontal: 40,
        // 720 of content plus the padding.
        maxWidth: 800,
    },
});
