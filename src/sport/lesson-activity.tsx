import { useState, type ReactNode } from 'react';
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
import { AddButton, ListRow } from '@/components/list-column';
import { Sheet } from '@/components/sheet';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { formatShortDay, todayDay } from '@/dates';
import { useLessonActivity, type LessonPack } from '@/hooks/use-lessons';
import { useTheme } from '@/hooks/use-theme';
import { balanceText, formatEuros, spentInYear } from '@/sport/lessons';
import { PackSheet } from '@/sport/pack-sheet';

/**
 * One lesson activity: its balance, what it cost this year, and its packs and
 * lessons in one list, newest first.
 */
export function LessonActivityView({
    id,
    header,
    onGone,
    onLesson,
    style,
}: {
    id: string;
    /** The page header, given the activity's name once it has loaded. */
    header: (title: string) => ReactNode;
    /** Called after the activity is deleted. */
    onGone: () => void;
    /** Opens the workout form for a new lesson, or for `workoutId`. */
    onLesson: (typeId: string, workoutId?: string) => void;
    style?: StyleProp<ViewStyle>;
}) {
    const theme = useTheme();
    const { activity, error, reload } = useLessonActivity(id);
    const [confirming, setConfirming] = useState(false);
    const [packSheet, setPackSheet] = useState<{ pack?: LessonPack } | null>(
        null
    );
    const [actionError, setActionError] = useState<string | null>(null);
    const year = Number(todayDay().slice(0, 4));

    const archive = async (archived: boolean) => {
        setActionError(null);
        try {
            const res = await apiFetch(`/api/lesson-activities/${id}`, {
                method: 'PATCH',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ archived }),
            });
            if (!res.ok) throw new Error();
            reload();
        } catch {
            setActionError('Non riesco a salvare.');
        }
    };

    const remove = async () => {
        setActionError(null);
        try {
            const res = await apiFetch(`/api/lesson-activities/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok && res.status !== 404) throw new Error();
            onGone();
        } catch {
            setActionError('Non riesco a eliminare l’attività.');
        }
    };

    if (!activity) {
        return (
            <>
                {header('Pagamenti')}
                {activity === undefined && !error ? (
                    <ActivityIndicator
                        color={theme.textMuted}
                        style={styles.message}
                    />
                ) : (
                    <ThemedText
                        themeColor={error ? 'danger' : 'textMuted'}
                        style={styles.message}>
                        {error ?? 'Questa attività non esiste più.'}
                    </ThemedText>
                )}
            </>
        );
    }

    const history: {
        key: string;
        day: string;
        createdAt: string;
        text: string;
        pack?: LessonPack;
    }[] = [
        ...activity.packs.map((p) => ({
            key: p.id,
            day: p.paidOn,
            createdAt: p.createdAt,
            text: `${formatShortDay(p.paidOn)}, pacchetto da ${p.lessons}, ${formatEuros(p.amountCents)}`,
            pack: p,
        })),
        ...activity.lessons.map((l) => ({
            key: l.id,
            day: l.date,
            createdAt: l.createdAt,
            text: `${formatShortDay(l.date)}, lezione`,
        })),
    ].sort(
        (a, b) =>
            b.day.localeCompare(a.day) || b.createdAt.localeCompare(a.createdAt)
    );

    return (
        <>
            {header(activity.typeName)}
            <ScrollView contentContainerStyle={[styles.content, style]}>
                <View style={styles.summary}>
                    <ThemedText
                        type="subtitle"
                        themeColor={activity.balance < 0 ? 'danger' : 'text'}>
                        {balanceText(activity.balance)}
                    </ThemedText>
                    <ThemedText themeColor="textMuted">
                        Speso nel {year}:{' '}
                        {formatEuros(spentInYear(activity.packs, year))}
                    </ThemedText>
                    {activity.archived && (
                        <ThemedText type="small" themeColor="textMuted">
                            Archiviata
                        </ThemedText>
                    )}
                </View>

                <View style={styles.buttons}>
                    {!activity.archived && (
                        <AddButton
                            label="Ho fatto una lezione"
                            onPress={() => onLesson(activity.typeId)}
                        />
                    )}
                    <AddButton
                        label="Nuovo pacchetto"
                        onPress={() => setPackSheet({})}
                    />
                </View>

                {(error ?? actionError) && (
                    <ThemedText type="small" themeColor="danger">
                        {error ?? actionError}
                    </ThemedText>
                )}

                {history.length === 0 ? (
                    <ThemedText themeColor="textMuted">
                        Ancora nessun pacchetto o lezione.
                    </ThemedText>
                ) : (
                    history.map(({ key, text, pack }) =>
                        pack ? (
                            <ListRow
                                key={key}
                                onPress={() => setPackSheet({ pack })}>
                                <ThemedText>{text}</ThemedText>
                            </ListRow>
                        ) : (
                            <ListRow
                                key={key}
                                onPress={() => onLesson(activity.typeId, key)}>
                                <ThemedText>{text}</ThemedText>
                            </ListRow>
                        )
                    )
                )}

                <View style={styles.actions}>
                    <Pressable
                        onPress={() => archive(!activity.archived)}
                        accessibilityRole="button"
                        style={({ pressed }) => pressed && styles.pressed}>
                        <ThemedText style={{ color: theme.accent }}>
                            {activity.archived ? 'Ripristina' : 'Archivia'}
                        </ThemedText>
                    </Pressable>
                    <Pressable
                        onPress={() => setConfirming(true)}
                        accessibilityRole="button"
                        style={({ pressed }) => pressed && styles.pressed}>
                        <ThemedText themeColor="danger">Elimina</ThemedText>
                    </Pressable>
                </View>
            </ScrollView>

            {packSheet && (
                <PackSheet
                    activityId={id}
                    pack={packSheet.pack}
                    onSaved={reload}
                    onClose={() => setPackSheet(null)}
                />
            )}

            <Sheet visible={confirming} onClose={() => setConfirming(false)}>
                <ThemedText type="subtitle" style={styles.sheetTitle}>
                    Eliminare {activity.typeName}?
                </ThemedText>
                <ThemedText themeColor="textMuted" style={styles.center}>
                    I pacchetti spariscono, gli allenamenti restano in Sport.
                </ThemedText>
                <Pressable
                    onPress={() => {
                        setConfirming(false);
                        remove();
                    }}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                        styles.sheetButton,
                        pressed && styles.pressed,
                    ]}>
                    <ThemedText themeColor="danger">Elimina</ThemedText>
                </Pressable>
                <Pressable
                    onPress={() => setConfirming(false)}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                        styles.sheetButton,
                        { borderTopWidth: 1, borderTopColor: theme.border },
                        pressed && styles.pressed,
                    ]}>
                    <ThemedText>Annulla</ThemedText>
                </Pressable>
            </Sheet>
        </>
    );
}

const styles = StyleSheet.create({
    message: {
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.three,
        textAlign: 'center',
    },
    content: {
        padding: Spacing.four,
        gap: Spacing.two,
    },
    summary: {
        gap: Spacing.one,
        paddingBottom: Spacing.three,
    },
    buttons: {
        gap: Spacing.two,
        paddingBottom: Spacing.two,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.five,
        paddingTop: Spacing.four,
    },
    center: {
        textAlign: 'center',
    },
    sheetTitle: {
        textAlign: 'center',
        paddingTop: Spacing.three,
        paddingBottom: Spacing.one,
    },
    sheetButton: {
        alignItems: 'center',
        paddingVertical: Spacing.three,
    },
    pressed: {
        opacity: 0.6,
    },
});
