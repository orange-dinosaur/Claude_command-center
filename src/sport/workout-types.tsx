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
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useWorkoutTypes, type WorkoutType } from '@/hooks/use-sport';
import { useTheme } from '@/hooks/use-theme';

/** Renames workout types, and deletes the ones no workout uses. */
export function WorkoutTypes({
    header,
    onChanged,
    style,
}: {
    /** Shown above the rows when the page has no header of its own. */
    header?: ReactNode;
    /** Called after a rename or a delete. */
    onChanged?: () => void;
    style?: StyleProp<ViewStyle>;
}) {
    const theme = useTheme();
    const { types, setTypes, error } = useWorkoutTypes();
    const [editing, setEditing] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const replace = (updated: WorkoutType) => {
        setTypes((current) =>
            current?.map((t) => (t.id === updated.id ? updated : t))
        );
        onChanged?.();
    };

    const remove = async (id: string) => {
        setDeleteError(null);
        try {
            const res = await apiFetch(`/api/workout-types/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setTypes((current) => current?.filter((t) => t.id !== id));
                onChanged?.();
                return;
            }
            setDeleteError(
                res.status === 409
                    ? 'Questo tipo è usato da un allenamento.'
                    : 'Non riesco a eliminare il tipo.'
            );
        } catch {
            setDeleteError('Non riesco a eliminare il tipo.');
        }
    };

    return (
        <ScrollView contentContainerStyle={[styles.list, style]}>
            {header}

            {(error ?? deleteError) && (
                <ThemedText
                    type="small"
                    themeColor="danger"
                    style={styles.message}>
                    {error ?? deleteError}
                </ThemedText>
            )}

            {types === undefined ? (
                <ActivityIndicator
                    color={theme.textMuted}
                    style={styles.message}
                />
            ) : (
                <>
                    {types.length === 0 && (
                        <ThemedText
                            themeColor="textMuted"
                            style={styles.message}>
                            Nessun tipo. Li crei dal modulo dell’allenamento,
                            con “+ Nuovo tipo”.
                        </ThemedText>
                    )}
                    {types.map((type) =>
                        editing === type.id ? (
                            <RenameRow
                                key={type.id}
                                type={type}
                                onDone={(updated) => {
                                    if (updated) replace(updated);
                                    setEditing(null);
                                }}
                            />
                        ) : (
                            <View
                                key={type.id}
                                style={[
                                    styles.row,
                                    {
                                        backgroundColor:
                                            theme.backgroundElement,
                                    },
                                ]}>
                                <Pressable
                                    onPress={() => setEditing(type.id)}
                                    accessibilityRole="button"
                                    accessibilityHint="Rinomina"
                                    style={({ pressed }) => [
                                        styles.grow,
                                        pressed && styles.pressed,
                                    ]}>
                                    <ThemedText>{type.name}</ThemedText>
                                </Pressable>
                                {type.workouts > 0 ? (
                                    <ThemedText
                                        type="small"
                                        themeColor="textMuted">
                                        {type.workouts === 1
                                            ? 'Usato da 1 allenamento'
                                            : `Usato da ${type.workouts} allenamenti`}
                                    </ThemedText>
                                ) : (
                                    <Pressable
                                        onPress={() => remove(type.id)}
                                        accessibilityRole="button"
                                        hitSlop={Spacing.two}
                                        style={({ pressed }) =>
                                            pressed && styles.pressed
                                        }>
                                        <ThemedText themeColor="danger">
                                            Elimina
                                        </ThemedText>
                                    </Pressable>
                                )}
                            </View>
                        )
                    )}
                </>
            )}
        </ScrollView>
    );
}

/** A row turned into a name field; `onDone` gets the renamed type, or nothing. */
function RenameRow({
    type,
    onDone,
}: {
    type: WorkoutType;
    onDone: (updated?: WorkoutType) => void;
}) {
    const theme = useTheme();
    const [name, setName] = useState(type.name);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const save = async () => {
        if (!name.trim()) {
            setError('Scrivi il nome del tipo.');
            return;
        }
        if (name.trim() === type.name) return onDone();
        setBusy(true);
        setError(null);
        try {
            const res = await apiFetch(`/api/workout-types/${type.id}`, {
                method: 'PATCH',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            if (res.ok) {
                const { name: saved } = await res.json();
                return onDone({ ...type, name: saved });
            }
            setError(
                res.status === 409
                    ? 'Esiste già un tipo con questo nome.'
                    : 'Non riesco a rinominare il tipo.'
            );
        } catch {
            setError('Non riesco a rinominare il tipo.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <View style={styles.rename}>
            <TextField
                label="Nome del tipo"
                value={name}
                onChange={setName}
                placeholder={type.name}
                autoFocus
            />
            {error && (
                <ThemedText type="small" themeColor="danger">
                    {error}
                </ThemedText>
            )}
            <View style={styles.actions}>
                <Pressable
                    onPress={() => onDone()}
                    disabled={busy}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                        styles.smallButton,
                        pressed && styles.pressed,
                    ]}>
                    <ThemedText themeColor="textMuted">Annulla</ThemedText>
                </Pressable>
                <Pressable
                    onPress={save}
                    disabled={busy}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                        styles.smallButton,
                        { backgroundColor: theme.accent },
                        (pressed || busy) && styles.pressed,
                    ]}>
                    <ThemedText style={{ color: theme.onAccent }}>
                        Salva
                    </ThemedText>
                </Pressable>
            </View>
        </View>
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
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.three,
        borderRadius: 14,
    },
    grow: {
        flex: 1,
    },
    pressed: {
        opacity: 0.6,
    },
    rename: {
        gap: Spacing.two,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: Spacing.two,
    },
    smallButton: {
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        borderRadius: 14,
    },
});
