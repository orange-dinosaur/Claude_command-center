import { useEffect, useState, type ReactNode } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
    type StyleProp,
    type ViewStyle,
} from 'react-native';

import { apiFetch } from '@/auth/client';
import { Box, Check } from '@/components/check';
import { CycleAnswers } from '@/components/cycle-answers';
import { Stars } from '@/components/stars';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { MIDPOINT_LABELS, weeksBegun, weekStart } from '@/creativity/cycle';
import { THEMES } from '@/creativity/themes';
import { addDays, formatShortDay } from '@/dates';
import type { CycleWithWeeks, Week } from '@/hooks/use-cycles';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useTheme } from '@/hooks/use-theme';

const DAYS = [
    ['M', 'Monday'],
    ['T', 'Tuesday'],
    ['W', 'Wednesday'],
    ['T', 'Thursday'],
    ['F', 'Friday'],
    ['S', 'Saturday'],
    ['S', 'Sunday'],
] as const;

const emptyWeek = (week: number): Week => ({
    week,
    dailyPages: [false, false, false, false, false, false, false],
    outing: false,
    tinyAction: false,
    evidence: [],
    energy: null,
    notes: null,
    carryForward: null,
    reviewed: false,
});

/**
 * One week of a cycle: the theme to read, and the tracking to fill in. The
 * phone shows them in one column; desktop puts tracking in a box beside the
 * reading, with week 6's midpoint check-in among the tracking fields.
 */
export function WeekView({
    cycleId,
    number,
    onChanged,
    style,
}: {
    cycleId: string;
    number: number;
    /** Called after a change is saved. */
    onChanged?: () => void;
    style?: StyleProp<ViewStyle>;
}) {
    const theme = useTheme();
    const isDesktop = useIsDesktop();

    const [cycle, setCycle] = useState<CycleWithWeeks | null | undefined>();
    const [week, setWeek] = useState<Week>(emptyWeek(number));
    const [notes, setNotes] = useState('');
    const [carry, setCarry] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        apiFetch(`/api/cycles/${cycleId}`)
            .then((res) => (res.ok ? res.json() : Promise.reject()))
            .then((loaded: CycleWithWeeks) => {
                if (cancelled) return;
                const saved =
                    loaded.weeks.find((w) => w.week === number) ??
                    emptyWeek(number);
                setCycle(loaded);
                setWeek(saved);
                setNotes(saved.notes ?? '');
                setCarry(saved.carryForward ?? '');
            })
            .catch(() => {
                if (!cancelled) setCycle(null);
            });
        return () => {
            cancelled = true;
        };
    }, [cycleId, number]);

    // Shown at once, put back if the server refuses it.
    const save = async (changes: Partial<Week>) => {
        const before = week;
        setWeek({ ...week, ...changes });
        setError(null);
        try {
            const res = await apiFetch(
                `/api/cycles/${cycleId}/weeks/${number}`,
                {
                    method: 'PATCH',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify(changes),
                }
            );
            if (!res.ok) throw new Error();
            onChanged?.();
        } catch {
            setWeek(before);
            setError('Non riesco a salvare. Riprova.');
        }
    };

    const saveText = (key: 'notes' | 'carryForward', value: string) => {
        const text = value.trim() || null;
        if (text !== week[key]) save({ [key]: text });
    };

    const t = THEMES[number - 1];
    const last = cycle?.interruptedOn
        ? weeksBegun(cycle.startDate, cycle.interruptedOn)
        : 12;
    const found = cycle && t && number >= 1 && number <= last;

    if (cycle === undefined) {
        return (
            <ActivityIndicator color={theme.textMuted} style={styles.message} />
        );
    }
    if (!found) {
        return (
            <ThemedText themeColor="textMuted" style={styles.message}>
                Settimana non trovata.
            </ThemedText>
        );
    }

    const previous = cycle.weeks.find((w) => w.week === number - 1);
    const start = weekStart(cycle.startDate, number);

    const reading = (
        <>
            <View>
                <ThemedText type="subtitle">{t.title}</ThemedText>
                <ThemedText themeColor="textMuted">
                    {formatShortDay(start)} –{' '}
                    {formatShortDay(addDays(start, 6))}
                </ThemedText>
            </View>

            {previous?.carryForward && (
                <View style={[styles.carried, { borderColor: theme.accent }]}>
                    <ThemedText type="small" themeColor="textMuted">
                        Carry forward from week {number - 1}
                    </ThemedText>
                    <ThemedText>{previous.carryForward}</ThemedText>
                </View>
            )}

            <Section title="Focus">
                <ThemedText>{t.focus}</ThemedText>
            </Section>

            <Section title="Opening reflection">
                {t.questions.map((q) => (
                    <ThemedText key={q}>• {q}</ThemedText>
                ))}
            </Section>

            <Section title="Exercises">
                {t.exercises.map((e, i) => (
                    <ThemedText key={e}>
                        {i + 1}. {e}
                    </ThemedText>
                ))}
            </Section>

            <Section title="Creative outing ideas">
                <ThemedText>{t.outing}</ThemedText>
                <Check
                    label="Creative Outing · 1–2 hours"
                    checked={week.outing}
                    onPress={() => save({ outing: !week.outing })}
                />
            </Section>

            <Section title="Tiny action">
                <ThemedText>{t.tinyAction}</ThemedText>
                <Check
                    label="Tiny Creative Action · 15 minutes"
                    checked={week.tinyAction}
                    onPress={() => save({ tinyAction: !week.tinyAction })}
                />
            </Section>
        </>
    );

    const midpoint = number === 6 && (
        <Section title="Midpoint check-in">
            <CycleAnswers cycle={cycle} labels={MIDPOINT_LABELS} />
        </Section>
    );

    const tracking = (
        <>
            <Section title="Daily Pages · 25 minutes">
                <View style={styles.days}>
                    {DAYS.map(([letter, name], i) => {
                        const done = week.dailyPages[i];
                        return (
                            <Pressable
                                key={name}
                                onPress={() =>
                                    save({
                                        dailyPages: week.dailyPages.map(
                                            (d, j) => (j === i ? !d : d)
                                        ),
                                    })
                                }
                                accessibilityRole="checkbox"
                                accessibilityLabel={name}
                                aria-checked={done}
                                style={styles.day}>
                                <ThemedText type="small" themeColor="textMuted">
                                    {letter}
                                </ThemedText>
                                <Box checked={done} />
                            </Pressable>
                        );
                    })}
                </View>
            </Section>

            <Section title="Weekly evidence">
                {t.evidence.map((item, i) => (
                    <Check
                        key={item}
                        label={item}
                        checked={Boolean(week.evidence[i])}
                        onPress={() =>
                            save({
                                evidence: t.evidence.map((_, j) =>
                                    j === i
                                        ? !week.evidence[j]
                                        : Boolean(week.evidence[j])
                                ),
                            })
                        }
                    />
                ))}
            </Section>

            <Section title="Energy">
                <Stars
                    rating={week.energy}
                    onChange={(energy) => save({ energy })}
                    size={28}
                    glyph="●"
                    unit={['pallino', 'pallini']}
                    emptyLabel="Nessuna energia"
                />
            </Section>

            <TextField
                label="Notes & discoveries"
                value={notes}
                onChange={setNotes}
                onBlur={() => saveText('notes', notes)}
                placeholder=""
                multiline
            />
            {isDesktop && midpoint}
            <TextField
                label="Carry forward"
                value={carry}
                onChange={setCarry}
                onBlur={() => saveText('carryForward', carry)}
                placeholder=""
                multiline
            />

            <Check
                label="Review complete"
                checked={week.reviewed}
                onPress={() => save({ reviewed: !week.reviewed })}
            />

            {error && (
                <ThemedText
                    type="small"
                    themeColor="danger"
                    style={styles.message}>
                    {error}
                </ThemedText>
            )}
        </>
    );

    if (isDesktop) {
        return (
            <ScrollView contentContainerStyle={style}>
                <View style={styles.columns}>
                    <View style={[styles.reading, styles.column]}>
                        {reading}
                    </View>
                    <View
                        style={[
                            styles.tracking,
                            styles.column,
                            { borderColor: theme.border },
                        ]}>
                        {tracking}
                    </View>
                </View>
            </ScrollView>
        );
    }

    return (
        <ScrollView contentContainerStyle={[styles.page, style]}>
            {reading}
            {midpoint}
            {tracking}
        </ScrollView>
    );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <View style={styles.section}>
            <ThemedText type="small" themeColor="textMuted">
                {title}
            </ThemedText>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    message: {
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.three,
        textAlign: 'center',
    },
    page: {
        padding: Spacing.four,
        gap: Spacing.four,
    },
    columns: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 40,
    },
    column: {
        gap: Spacing.four,
    },
    reading: {
        flex: 1.2,
    },
    tracking: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 20,
        padding: Spacing.four,
    },
    carried: {
        borderLeftWidth: 3,
        paddingLeft: Spacing.three,
        gap: Spacing.one,
    },
    section: {
        gap: Spacing.two,
    },
    days: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    day: {
        alignItems: 'center',
        gap: Spacing.one,
        padding: Spacing.one,
    },
});
