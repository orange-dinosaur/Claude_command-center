import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { DateField } from '@/components/date-field';
import { FormActions } from '@/components/form-actions';
import { ScreenHeader } from '@/components/screen-header';
import { Stars } from '@/components/stars';
import { TabBar } from '@/components/tab-bar';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Kind, Sections, Status } from '@/hooks/use-titles';
import { STATUS_LABELS } from '@/media/labels';

const FORMATS = [
    'rigida',
    'flessibile',
    'ebook',
    'audiolibro',
    'biblioteca',
] as const;

type Format = (typeof FORMATS)[number];

const STATUSES: Status[] = ['todo', 'doing', 'done'];

const HEADERS: Record<Kind, { add: string; edit: string }> = {
    book: { add: 'Nuovo libro', edit: 'Libro' },
    film: { add: 'Nuovo film', edit: 'Film' },
    series: { add: 'Nuova serie', edit: 'Serie' },
};

const isKind = (value: unknown): value is Kind =>
    value === 'book' || value === 'film' || value === 'series';

/** Adds a title of `?kind=`, or edits the one in `?id=`. */
export default function TitlePage() {
    const theme = useTheme();
    const router = useRouter();
    const params = useLocalSearchParams<{ kind?: string; id?: string }>();
    const id = params.id;
    const kind: Kind = isKind(params.kind) ? params.kind : 'book';
    const labels = STATUS_LABELS[kind];

    const [name, setName] = useState('');
    const [author, setAuthor] = useState('');
    const [format, setFormat] = useState<Format | null>(null);
    const [season, setSeason] = useState('');
    const [status, setStatus] = useState<Status>('todo');
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);
    const [rating, setRating] = useState<number | null>(null);
    const [loading, setLoading] = useState(Boolean(id));
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        apiFetch(`/api/titles?kind=${kind}`)
            .then((res) => (res.ok ? res.json() : Promise.reject()))
            .then((sections: Sections) => {
                if (cancelled) return;
                const found = [
                    ...sections.doing,
                    ...sections.todo,
                    ...sections.done,
                ].find((t) => t.id === id);
                if (found) {
                    setName(found.name);
                    setAuthor(found.author ?? '');
                    setFormat(found.format as Format | null);
                    setSeason(found.season ? String(found.season) : '');
                    setStatus(found.status);
                    setStartDate(found.startDate);
                    setEndDate(found.endDate);
                    setRating(found.rating);
                } else {
                    setError('Titolo non trovato.');
                }
            })
            .catch(() => {
                if (!cancelled) setError('Non riesco a caricare il titolo.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [id, kind]);

    const backToList = () =>
        router.canGoBack() ? router.back() : router.replace('/media');

    const save = async () => {
        if (!name.trim()) {
            setError('Scrivi il titolo.');
            return;
        }
        const seasonNumber = Number(season.trim());
        if (
            kind === 'series' &&
            !(Number.isInteger(seasonNumber) && seasonNumber >= 1)
        ) {
            setError('Scrivi il numero della stagione.');
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const res = await apiFetch(
                id ? `/api/titles/${id}` : '/api/titles',
                {
                    method: id ? 'PATCH' : 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({
                        ...(id ? {} : { kind }),
                        name,
                        ...(kind === 'book' && { author, format }),
                        ...(kind === 'series' && { season: seasonNumber }),
                        status,
                        startDate,
                        endDate,
                        rating,
                    }),
                }
            );
            if (res.ok) return backToList();
            const body = await res.json().catch(() => null);
            setError(
                body?.error === 'End before start'
                    ? 'La fine è prima dell’inizio.'
                    : 'Non riesco a salvare il titolo.'
            );
        } catch {
            setError('Non riesco a salvare il titolo.');
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        setBusy(true);
        setError(null);
        try {
            const res = await apiFetch(`/api/titles/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) return backToList();
            setError('Non riesco a eliminare il titolo.');
        } catch {
            setError('Non riesco a eliminare il titolo.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader
                    title={id ? HEADERS[kind].edit : HEADERS[kind].add}
                    backTo="/media"
                />

                {loading ? (
                    <ActivityIndicator
                        color={theme.textMuted}
                        style={styles.loading}
                    />
                ) : (
                    <ScrollView contentContainerStyle={styles.body}>
                        <TextField
                            label="Titolo"
                            value={name}
                            onChange={setName}
                            placeholder={
                                kind === 'book'
                                    ? 'Il nome della rosa'
                                    : kind === 'film'
                                      ? 'Heat'
                                      : 'The Bear'
                            }
                        />
                        {kind === 'book' && (
                            <TextField
                                label="Autore"
                                value={author}
                                onChange={setAuthor}
                                placeholder="Umberto Eco"
                            />
                        )}
                        {kind === 'series' && (
                            <TextField
                                label="Stagione"
                                value={season}
                                onChange={setSeason}
                                placeholder="1"
                                keyboardType="number-pad"
                            />
                        )}
                        {kind === 'book' && (
                            <Field label="Formato">
                                <View style={styles.chips}>
                                    {FORMATS.map((f) => {
                                        const selected = f === format;
                                        return (
                                            <Pressable
                                                key={f}
                                                onPress={() =>
                                                    setFormat(
                                                        selected ? null : f
                                                    )
                                                }
                                                accessibilityRole="button"
                                                accessibilityState={{
                                                    selected,
                                                }}
                                                style={[
                                                    styles.chip,
                                                    {
                                                        backgroundColor:
                                                            selected
                                                                ? theme.accent
                                                                : theme.backgroundElement,
                                                    },
                                                ]}>
                                                <ThemedText
                                                    style={
                                                        selected && {
                                                            color: theme.onAccent,
                                                        }
                                                    }>
                                                    {f}
                                                </ThemedText>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </Field>
                        )}
                        <Field label="Stato">
                            <TabBar
                                tabs={STATUSES.map((s) => labels[s])}
                                value={labels[status]}
                                onChange={(label) =>
                                    setStatus(
                                        STATUSES.find(
                                            (s) => labels[s] === label
                                        ) ?? 'todo'
                                    )
                                }
                                style={styles.status}
                            />
                        </Field>
                        <Field label="Inizio">
                            <DateField
                                value={startDate}
                                onChange={setStartDate}
                                label="Inizio"
                            />
                        </Field>
                        <Field label="Fine">
                            <DateField
                                value={endDate}
                                onChange={setEndDate}
                                label="Fine"
                            />
                        </Field>
                        <Field label="Voto">
                            <Stars
                                rating={rating}
                                onChange={setRating}
                                size={36}
                            />
                        </Field>

                        <FormActions
                            error={error}
                            busy={busy}
                            onSave={save}
                            onDelete={id ? remove : undefined}
                            name={name}
                        />
                    </ScrollView>
                )}
            </SafeAreaView>
        </ThemedView>
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <View style={styles.fieldGroup}>
            <ThemedText type="small" themeColor="textMuted">
                {label}
            </ThemedText>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loading: {
        paddingVertical: Spacing.three,
    },
    body: {
        flexGrow: 1,
        padding: Spacing.four,
        gap: Spacing.three,
    },
    fieldGroup: {
        gap: Spacing.one,
    },
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.two,
    },
    chip: {
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        borderRadius: 999,
    },
    status: {
        marginHorizontal: 0,
    },
});
