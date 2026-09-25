import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiFetch } from '@/auth/client';
import { Box, Check } from '@/components/check';
import { ScreenHeader } from '@/components/screen-header';
import { Stars } from '@/components/stars';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { weeksBegun, weekStart } from '@/creativity/cycle';
import { THEMES } from '@/creativity/themes';
import { addDays, formatShortDay } from '@/dates';
import type { CycleWithWeeks, Week } from '@/hooks/use-cycles';
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

export default function WeekScreen() {
    const theme = useTheme();
    const params = useLocalSearchParams<{ cycle: string; week: string }>();
    const number = Number(params.week);

    const [cycle, setCycle] = useState<CycleWithWeeks | null | undefined>();
    const [week, setWeek] = useState<Week>(emptyWeek(number));
    const [notes, setNotes] = useState('');
    const [carry, setCarry] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        apiFetch(`/api/cycles/${params.cycle}`)
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
    }, [params.cycle, number]);

    // Shown at once, put back if the server refuses it.
    const save = async (changes: Partial<Week>) => {
        const before = week;
        setWeek({ ...week, ...changes });
        setError(null);
        try {
            const res = await apiFetch(
                `/api/cycles/${params.cycle}/weeks/${number}`,
                {
                    method: 'PATCH',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify(changes),
                }
            );
            if (!res.ok) throw new Error();
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
    const previous = cycle?.weeks.find((w) => w.week === number - 1);
    const start = cycle ? weekStart(cycle.startDate, number) : '';

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader
                    title={`Settimana ${number}`}
                    backTo="/creativita"
                />

                {cycle === undefined ? (
                    <ActivityIndicator
                        color={theme.textMuted}
                        style={styles.message}
                    />
                ) : !found ? (
                    <ThemedText themeColor="textMuted" style={styles.message}>
                        Settimana non trovata.
                    </ThemedText>
                ) : (
                    <ScrollView contentContainerStyle={styles.page}>
                        <View>
                            <ThemedText type="subtitle">{t.title}</ThemedText>
                            <ThemedText themeColor="textMuted">
                                {formatShortDay(start)} –{' '}
                                {formatShortDay(addDays(start, 6))}
                            </ThemedText>
                        </View>

                        {previous?.carryForward && (
                            <View
                                style={[
                                    styles.carried,
                                    { borderColor: theme.accent },
                                ]}>
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
                                onPress={() =>
                                    save({ tinyAction: !week.tinyAction })
                                }
                            />
                        </Section>

                        <Section title="Daily Pages · 25 minutes">
                            <View style={styles.days}>
                                {DAYS.map(([letter, name], i) => {
                                    const done = week.dailyPages[i];
                                    return (
                                        <Pressable
                                            key={name}
                                            onPress={() =>
                                                save({
                                                    dailyPages:
                                                        week.dailyPages.map(
                                                            (d, j) =>
                                                                j === i ? !d : d
                                                        ),
                                                })
                                            }
                                            accessibilityRole="checkbox"
                                            accessibilityLabel={name}
                                            aria-checked={done}
                                            style={styles.day}>
                                            <ThemedText
                                                type="small"
                                                themeColor="textMuted">
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
                    </ScrollView>
                )}
            </SafeAreaView>
        </ThemedView>
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
    container: {
        flex: 1,
    },
    message: {
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.three,
        textAlign: 'center',
    },
    page: {
        padding: Spacing.four,
        gap: Spacing.four,
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
