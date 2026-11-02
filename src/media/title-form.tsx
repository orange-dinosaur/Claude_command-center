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
import { CoverField } from '@/media/cover-picker';
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
    const [cover, setCover] = useState<string | null>(null);
    // Languages already used on books, offered as chips.
    const [languages, setLanguages] = useState<string[]>([]);
    const [format, setFormat] = useState<Format | null>(null);
    const [season, setSeason] = useState('');
    const [episodes, setEpisodes] = useState('');
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
                    setCover(found.coverUrl);
                    setFormat(found.format as Format | null);
                    setSeason(found.season ? String(found.season) : '');
                    setEpisodes(found.episodes ? String(found.episodes) : '');
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
        const episodeCount = episodes.trim() ? Number(episodes.trim()) : null;
        if (
            episodeCount !== null &&
            !(
                Number.isInteger(episodeCount) &&
                episodeCount >= 1 &&
                episodeCount <= 999
            )
        ) {
            setError('Gli episodi vanno da 1 a 999.');
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
                        ...(kind === 'book' && { author, format, cover }),
                        ...(kind !== 'series' && { language }),
                        ...(kind === 'series' && {
                            season: seasonNumber,
                            episodes: episodeCount,
                        }),
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

    const nameField = (
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
    );

    return (
        <ScrollView contentContainerStyle={[styles.body, style]}>
            {title && <ThemedText type="title">{title}</ThemedText>}
            {kind === 'book' ? (
                <View style={styles.cover}>
                    <CoverField
                        value={cover}
                        onChange={setCover}
                        query={`${name} ${author}`.trim()}
                        language={language}
                    />
                    <View style={styles.names}>
                        {nameField}
                        <TextField
                            label="Autore"
                            value={author}
                            onChange={setAuthor}
                            placeholder="Umberto Eco"
                        />
                    </View>
                </View>
            ) : (
                nameField
            )}
            {kind !== 'series' && (
                <LanguageField
                    value={language}
                    onChange={setLanguage}
                    languages={languages}
                />
            )}
            {kind === 'series' && (
                <View style={styles.pair}>
                    <View style={styles.half}>
                        <TextField
                            label="Stagione"
                            value={season}
                            onChange={setSeason}
                            placeholder="1"
                            keyboardType="number-pad"
                        />
                    </View>
                    <View style={styles.half}>
                        <TextField
                            label="Episodi"
                            value={episodes}
                            onChange={setEpisodes}
                            placeholder="10"
                            keyboardType="number-pad"
                        />
                    </View>
                </View>
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
            <View style={styles.pair}>
                <View style={styles.half}>
                    <Field label="Inizio">
                        <DateField
                            value={startDate}
                            onChange={setStartDate}
                            label="Inizio"
                        />
                    </Field>
                </View>
                <View style={styles.half}>
                    <Field label="Fine">
                        <DateField
                            value={endDate}
                            onChange={setEndDate}
                            label="Fine"
                        />
                    </Field>
                </View>
            </View>
            <View style={styles.rating}>
                <ThemedText type="small" themeColor="textMuted">
                    Voto
                </ThemedText>
                <Stars rating={rating} onChange={setRating} size={36} />
            </View>

            <FormActions
                error={error}
                busy={busy}
                onSave={save}
                onDelete={id ? remove : undefined}
                name={name}
                compact
            />
        </ScrollView>
    );
}

/** Picks one of `languages`, or takes a new one in a text field. */
export function LanguageField({
    value,
    onChange,
    languages,
}: {
    value: string;
    onChange: (language: string) => void;
    languages: string[];
}) {
    const theme = useTheme();
    const [isNew, setIsNew] = useState(false);

    return (
        <Field label="Lingua">
            <View style={styles.chips}>
                {languages.map((l) => {
                    const selected = l === value;
                    return (
                        <Chip
                            key={l}
                            label={l}
                            selected={selected}
                            onPress={() => {
                                onChange(selected ? '' : l);
                                setIsNew(false);
                            }}
                        />
                    );
                })}
                {!isNew && (
                    <Pressable
                        onPress={() => {
                            onChange('');
                            setIsNew(true);
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
            {isNew && (
                <TextField
                    label="Nuova lingua"
                    value={value}
                    onChange={onChange}
                    placeholder="Inglese"
                    autoFocus
                />
            )}
        </Field>
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
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.two,
        gap: Spacing.two,
    },
    fieldGroup: {
        gap: Spacing.one,
    },
    cover: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
    },
    names: {
        flex: 1,
        gap: Spacing.two,
    },
    pair: {
        flexDirection: 'row',
        gap: Spacing.two,
    },
    half: {
        flex: 1,
    },
    rating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
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
