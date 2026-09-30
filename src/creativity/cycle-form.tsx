import { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    View,
    type StyleProp,
    type ViewStyle,
} from 'react-native';

import { apiFetch } from '@/auth/client';
import { DateField } from '@/components/date-field';
import { FormActions } from '@/components/form-actions';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { ANSWER_LABELS } from '@/creativity/cycle';
import { addDays, formatDay, todayDay } from '@/dates';
import type { Cycle } from '@/hooks/use-cycles';

type AnswerKey = keyof typeof ANSWER_LABELS;

const ANSWER_KEYS = Object.keys(ANSWER_LABELS) as AnswerKey[];

const answersOf = (cycle?: Cycle) =>
    Object.fromEntries(
        ANSWER_KEYS.map((key) => [key, cycle?.[key] ?? ''])
    ) as Record<AnswerKey, string>;

const ERRORS: Record<string, string> = {
    'Overlaps another cycle': 'Queste date si sovrappongono a un altro ciclo.',
    'An interrupted cycle cannot move': 'Un ciclo interrotto non si sposta.',
};

/** `day` itself if it is a Monday, else the Monday after it. */
const mondayFrom = (day: string) =>
    addDays(day, (8 - new Date(`${day}T00:00:00Z`).getUTCDay()) % 7);

/** Starts a cycle, or edits, interrupts or deletes the one with `id`. */
export function CycleForm({
    id,
    title,
    onDone,
    style,
}: {
    id?: string;
    /** Shown above the fields when the page has no header of its own. */
    title?: string;
    /** Called with the saved cycle after a save or an interruption, or with null after a delete. */
    onDone: (saved: Cycle | null) => void;
    style?: StyleProp<ViewStyle>;
}) {
    const today = todayDay();

    const [cycle, setCycle] = useState<Cycle | null>(null);
    const [startDate, setStartDate] = useState<string | null>(null);
    const [answers, setAnswers] = useState(answersOf);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const json = (res: Response) =>
            res.ok ? res.json() : Promise.reject();

        if (id) {
            apiFetch(`/api/cycles/${id}`)
                .then(json)
                .then((loaded: Cycle) => {
                    if (cancelled) return;
                    setCycle(loaded);
                    setStartDate(loaded.startDate);
                    setAnswers(answersOf(loaded));
                })
                .catch(() => {
                    if (!cancelled) setError('Non riesco a caricare il ciclo.');
                });
        } else {
            // The first free Monday: from today, and after the latest cycle.
            apiFetch('/api/cycles')
                .then(json)
                .then((cycles: Cycle[]) => {
                    if (cancelled) return;
                    const after = cycles[0] && addDays(cycles[0].endDate, 1);
                    setStartDate(
                        mondayFrom(after && after > today ? after : today)
                    );
                })
                .catch(() => {
                    if (!cancelled) setStartDate(mondayFrom(today));
                });
        }
        return () => {
            cancelled = true;
        };
    }, [id, today]);

    const send = async (path: string, init: RequestInit, failure: string) => {
        setBusy(true);
        setError(null);
        try {
            const res = await apiFetch(path, {
                ...init,
                headers: { 'content-type': 'application/json' },
            });
            if (res.ok) {
                return onDone(
                    init.method === 'DELETE' ? null : await res.json()
                );
            }
            const body = await res.json().catch(() => null);
            setError(ERRORS[body?.error] ?? failure);
        } catch {
            setError(failure);
        } finally {
            setBusy(false);
        }
    };

    const save = () => {
        if (!startDate) return;
        const trimmed = Object.fromEntries(
            ANSWER_KEYS.map((key) => [key, answers[key].trim() || null])
        );
        send(
            id ? `/api/cycles/${id}` : '/api/cycles',
            {
                method: id ? 'PATCH' : 'POST',
                body: JSON.stringify({ startDate, ...trimmed }),
            },
            'Non riesco a salvare il ciclo.'
        );
    };

    const inProgress =
        cycle !== null &&
        !cycle.interruptedOn &&
        cycle.startDate <= today &&
        today <= cycle.endDate;

    return (
        <ScrollView contentContainerStyle={[styles.form, style]}>
            {title && <ThemedText type="title">{title}</ThemedText>}
            <View style={styles.group}>
                <ThemedText type="small" themeColor="textMuted">
                    Inizio, sempre di lunedì
                </ThemedText>
                {cycle?.interruptedOn ? (
                    <ThemedText>{formatDay(cycle.startDate)}</ThemedText>
                ) : (
                    <DateField
                        label="Inizio"
                        value={startDate}
                        onChange={setStartDate}
                        mondaysOnly
                    />
                )}
            </View>

            {ANSWER_KEYS.map((key) => (
                <TextField
                    key={key}
                    label={ANSWER_LABELS[key]}
                    value={answers[key]}
                    onChange={(value) =>
                        setAnswers((a) => ({ ...a, [key]: value }))
                    }
                    placeholder="Facoltativo"
                    multiline
                />
            ))}

            <FormActions
                error={error}
                busy={busy}
                onSave={save}
                name="questo ciclo"
                onDelete={
                    id
                        ? () =>
                              send(
                                  `/api/cycles/${id}`,
                                  { method: 'DELETE' },
                                  'Non riesco a eliminare il ciclo.'
                              )
                        : undefined
                }
                extra={
                    inProgress
                        ? {
                              label: 'Interrompi ciclo',
                              question:
                                  'Interrompere il ciclo oggi? Le settimane non iniziate spariscono.',
                              onConfirm: () =>
                                  send(
                                      `/api/cycles/${id}`,
                                      {
                                          method: 'PATCH',
                                          body: JSON.stringify({
                                              interruptOn: today,
                                          }),
                                      },
                                      'Non riesco a interrompere il ciclo.'
                                  ),
                          }
                        : undefined
                }
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    form: {
        flexGrow: 1,
        padding: Spacing.four,
        gap: Spacing.three,
    },
    group: {
        gap: Spacing.one,
    },
});
