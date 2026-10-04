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
import { DateField } from '@/components/date-field';
import { FormActions } from '@/components/form-actions';
import { Stars } from '@/components/stars';
import { TabBar } from '@/components/tab-bar';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Kind, Sections, Status, Title } from '@/hooks/use-titles';
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

export const TITLE_HEADERS: Record<Kind, { add: string; edit: string }> = {
    book: { add: 'Nuovo libro', edit: 'Libro' },
    film: { add: 'Nuovo film', edit: 'Film' },
    series: { add: 'Nuova serie', edit: 'Serie' },
};

export const isKind = (value: unknown): value is Kind =>
    value === 'book' || value === 'film' || value === 'series';

/** Adds a title of `kind`, or edits the one with `id`. */
export function TitleForm({
    kind,
    id,
    title,
    onSaved,
    onDeleted,
    style,
}: {
    kind: Kind;
    /** The title to edit; without it the form adds a new one. */
    id?: string;
    /** Shown above the fields when the page has no header of its own. */
    title?: string;
    onSaved: (saved: Title) => void;
    onDeleted: () => void;
    style?: StyleProp<ViewStyle>;
}) {
    const theme = useTheme();
    const labels = STATUS_LABELS[kind];

    const [name, setName] = useState('');
    const [author, setAuthor] = useState('');
    const [language, setLanguage] = useState('');
    // Languages already used on books, offered as chips.
    const [languages, setLanguages] = useState<string[]>([]);
    const [newLanguage, setNewLanguage] = useState(false);
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
        if (!id && kind === 'series') return;
        let cancelled = false;
        apiFetch(`/api/titles?kind=${kind}`)
            .then((res) => (res.ok ? res.json() : Promise.reject()))
            .then((sections: Sections) => {
                if (cancelled) return;
                const all = [
                    ...sections.doing,
                    ...sections.todo,
                    ...sections.done,
                ];
                setLanguages(
                    [...new Set(all.flatMap((t) => t.language ?? []))].sort()
                );
                if (!id) return;
                const found = all.find((t) => t.id === id);
                if (found) {
                    setName(found.name);
                    setAuthor(found.author ?? '');
                    setLanguage(found.language ?? '');
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
                if (!cancelled && id) {
                    setError('Non riesco a caricare il titolo.');
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [id, kind]);

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
                        ...(kind !== 'series' && { language }),
                        ...(kind === 'series' && { season: seasonNumber }),
                        status,
                        startDate,
                        endDate,
                        rating,
                    }),
                }
            );
            if (res.ok) {
                return onSaved((await res.json()) as Title);
            }
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
            if (res.ok) return onDeleted();
            setError('Non riesco a eliminare il titolo.');
        } catch {
            setError('Non riesco a eliminare il titolo.');
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <ActivityIndicator color={theme.textMuted} style={styles.loading} />
        );
    }

    return (
        <ScrollView contentContainerStyle={[styles.body, style]}>
            {title && <ThemedText type="title">{title}</ThemedText>}
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
            {kind !== 'series' && (
                <Field label="Lingua">
                    <View style={styles.chips}>
                        {languages.map((l) => {
                            const selected = l === language;
                            return (
                                <Chip
                                    key={l}
                                    label={l}
                                    selected={selected}
                                    onPress={() => {
                                        setLanguage(selected ? '' : l);
                                        setNewLanguage(false);
                                    }}
                                />
                            );
                        })}
                        {!newLanguage && (
                            <Pressable
                                onPress={() => {
                                    setLanguage('');
                                    setNewLanguage(true);
                                }}
                                accessibilityRole="button"
                                style={[
                                    styles.chip,
                                    {
                                        borderColor: theme.accent,
                                        borderWidth: 1,
                                    },
                                ]}>
                                <ThemedText style={{ color: theme.accent }}>
                                    + Nuova lingua
                                </ThemedText>
                            </Pressable>
                        )}
                    </View>
                    {newLanguage && (
                        <TextField
                            label="Nuova lingua"
                            value={language}
                            onChange={setLanguage}
                            placeholder="Inglese"
                            autoFocus
                        />
                    )}
                </Field>
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
                                <Chip
                                    key={f}
                                    label={f}
                                    selected={selected}
                                    onPress={() =>
                                        setFormat(selected ? null : f)
                                    }
                                />
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
                            STATUSES.find((s) => labels[s] === label) ?? 'todo'
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
                <DateField value={endDate} onChange={setEndDate} label="Fine" />
            </Field>
            <Field label="Voto">
                <Stars rating={rating} onChange={setRating} size={36} />
            </Field>

            <FormActions
                error={error}
                busy={busy}
                onSave={save}
                onDelete={id ? remove : undefined}
                name={name}
            />
        </ScrollView>
    );
}

function Chip({
    label,
    selected,
    onPress,
}: {
    label: string;
    selected: boolean;
    onPress: () => void;
}) {
    const theme = useTheme();
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[
                styles.chip,
                {
                    backgroundColor: selected
                        ? theme.accent
                        : theme.backgroundElement,
                },
            ]}>
            <ThemedText style={selected && { color: theme.onAccent }}>
                {label}
            </ThemedText>
        </Pressable>
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
