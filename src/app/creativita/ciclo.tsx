import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiFetch } from '@/auth/client';
import { DateField } from '@/components/date-field';
import { FormActions } from '@/components/form-actions';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { INTENT_LABELS } from '@/creativity/cycle';
import { addDays, formatDay, todayDay } from '@/dates';
import type { Cycle } from '@/hooks/use-cycles';

type IntentKey = keyof typeof INTENT_LABELS;

const INTENT_KEYS = Object.keys(INTENT_LABELS) as IntentKey[];

const ERRORS: Record<string, string> = {
    'Overlaps another cycle': 'Queste date si sovrappongono a un altro ciclo.',
    'An interrupted cycle cannot move': 'Un ciclo interrotto non si sposta.',
};

/** `day` itself if it is a Monday, else the Monday after it. */
const mondayFrom = (day: string) =>
    addDays(day, (8 - new Date(`${day}T00:00:00Z`).getUTCDay()) % 7);

export default function CycleForm() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const today = todayDay();

    const [cycle, setCycle] = useState<Cycle | null>(null);
    const [startDate, setStartDate] = useState<string | null>(null);
    const [intents, setIntents] = useState<Record<IntentKey, string>>({
        intentPractice: '',
        intentFeeling: '',
        intentProject: '',
    });
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
                    setIntents({
                        intentPractice: loaded.intentPractice ?? '',
                        intentFeeling: loaded.intentFeeling ?? '',
                        intentProject: loaded.intentProject ?? '',
                    });
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

    const leave = () =>
        router.canGoBack() ? router.back() : router.replace('/creativita');

    const send = async (path: string, init: RequestInit, failure: string) => {
        setBusy(true);
        setError(null);
        try {
            const res = await apiFetch(path, {
                ...init,
                headers: { 'content-type': 'application/json' },
            });
            if (res.ok) return leave();
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
        const answers = Object.fromEntries(
            INTENT_KEYS.map((key) => [key, intents[key].trim() || null])
        );
        send(
            id ? `/api/cycles/${id}` : '/api/cycles',
            {
                method: id ? 'PATCH' : 'POST',
                body: JSON.stringify({ startDate, ...answers }),
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
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader
                    title={id ? 'Modifica ciclo' : 'Nuovo ciclo'}
                    backTo="/creativita"
                />
                <ScrollView contentContainerStyle={styles.form}>
                    <View style={styles.group}>
                        <ThemedText type="small" themeColor="textMuted">
                            Inizio, sempre di lunedì
                        </ThemedText>
                        {cycle?.interruptedOn ? (
                            <ThemedText>
                                {formatDay(cycle.startDate)}
                            </ThemedText>
                        ) : (
                            <DateField
                                label="Inizio"
                                value={startDate}
                                onChange={setStartDate}
                                mondaysOnly
                            />
                        )}
                    </View>

                    {INTENT_KEYS.map((key) => (
                        <TextField
                            key={key}
                            label={INTENT_LABELS[key]}
                            value={intents[key]}
                            onChange={(value) =>
                                setIntents((i) => ({ ...i, [key]: value }))
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
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    form: {
        flexGrow: 1,
        padding: Spacing.four,
        gap: Spacing.three,
    },
    group: {
        gap: Spacing.one,
    },
});
