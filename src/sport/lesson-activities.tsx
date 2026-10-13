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
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useLessonActivities, type LessonActivity } from '@/hooks/use-lessons';
import { useWorkoutTypes } from '@/hooks/use-sport';
import { useTheme } from '@/hooks/use-theme';
import { balanceText } from '@/sport/lessons';

/** The lesson activities with their balance, and the way to add one. */
export function LessonActivities({
    header,
    onOpen,
    style,
}: {
    /** Shown above the rows when the page has no header of its own. */
    header?: ReactNode;
    onOpen: (id: string) => void;
    style?: StyleProp<ViewStyle>;
}) {
    const theme = useTheme();
    const { activities, setActivities, error } = useLessonActivities();
    const { types } = useWorkoutTypes();
    const [choosing, setChoosing] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);

    const taken = new Set(activities?.map((a) => a.typeId));
    const free = (types ?? []).filter((t) => !taken.has(t.id));
    const open = activities?.filter((a) => !a.archived) ?? [];
    const archived = activities?.filter((a) => a.archived) ?? [];

    const add = async (typeId: string) => {
        setAddError(null);
        try {
            const res = await apiFetch('/api/lesson-activities', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ typeId }),
            });
            if (!res.ok) throw new Error();
            const created: LessonActivity = await res.json();
            setActivities((current) =>
                [...(current ?? []), created].sort((a, b) =>
                    a.typeName.localeCompare(b.typeName, 'it')
                )
            );
            setChoosing(false);
        } catch {
            setAddError('Non riesco ad aggiungere l’attività.');
        }
    };

    const row = (activity: LessonActivity) => (
        <ListRow key={activity.id} onPress={() => onOpen(activity.id)}>
            <ThemedText style={styles.grow}>{activity.typeName}</ThemedText>
            <ThemedText
                type="small"
                themeColor={activity.balance < 0 ? 'danger' : 'textMuted'}>
                {balanceText(activity.balance)}
            </ThemedText>
        </ListRow>
    );

    return (
        <ScrollView contentContainerStyle={[styles.list, style]}>
            {header}

            {(error ?? addError) && (
                <ThemedText
                    type="small"
                    themeColor="danger"
                    style={styles.message}>
                    {error ?? addError}
                </ThemedText>
            )}

            {activities === undefined ? (
                <ActivityIndicator
                    color={theme.textMuted}
                    style={styles.message}
                />
            ) : (
                <>
                    {activities.length === 0 && (
                        <ThemedText
                            themeColor="textMuted"
                            style={styles.message}>
                            Scegli un tipo di allenamento per cui paghi lezioni
                            in anticipo.
                        </ThemedText>
                    )}

                    {open.map(row)}

                    {choosing ? (
                        <View style={styles.choices}>
                            {free.map((type) => (
                                <ListRow
                                    key={type.id}
                                    onPress={() => add(type.id)}>
                                    <ThemedText style={styles.grow}>
                                        {type.name}
                                    </ThemedText>
                                </ListRow>
                            ))}
                            <Pressable
                                onPress={() => setChoosing(false)}
                                accessibilityRole="button"
                                style={({ pressed }) => [
                                    styles.cancel,
                                    pressed && styles.pressed,
                                ]}>
                                <ThemedText themeColor="textMuted">
                                    Annulla
                                </ThemedText>
                            </Pressable>
                        </View>
                    ) : (
                        <>
                            <AddButton
                                label="Nuova attività"
                                onPress={() => setChoosing(true)}
                                disabled={free.length === 0}
                                style={[
                                    styles.add,
                                    free.length === 0 && styles.disabled,
                                ]}
                            />
                            {types !== undefined && free.length === 0 && (
                                <ThemedText
                                    type="small"
                                    themeColor="textMuted"
                                    style={styles.center}>
                                    Aggiungi prima un tipo in Tipi.
                                </ThemedText>
                            )}
                        </>
                    )}

                    {archived.length > 0 && (
                        <>
                            <ThemedText
                                type="small"
                                themeColor="textMuted"
                                style={styles.section}>
                                Archiviate
                            </ThemedText>
                            {archived.map(row)}
                        </>
                    )}
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    message: {
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.three,
        textAlign: 'center',
    },
    list: {
        padding: Spacing.four,
        gap: Spacing.two,
    },
    grow: {
        flex: 1,
    },
    choices: {
        gap: Spacing.two,
        marginTop: Spacing.two,
    },
    cancel: {
        alignSelf: 'center',
        padding: Spacing.three,
    },
    add: {
        marginTop: Spacing.two,
    },
    disabled: {
        opacity: 0.4,
    },
    center: {
        textAlign: 'center',
    },
    section: {
        marginTop: Spacing.four,
    },
    pressed: {
        opacity: 0.6,
    },
});
