/**
 * The form for a saga: name, author, volumes planned and next release. An
 * existing saga can be archived or restored, and be deleted.
 */

import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    type StyleProp,
    type ViewStyle,
} from 'react-native';

import { apiFetch } from '@/auth/client';
import { FormActions } from '@/components/form-actions';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { parseCount } from '@/habits/habit-form';
import type { Saga } from '@/hooks/use-sagas';
import { useTheme } from '@/hooks/use-theme';
import { NAME_MAX, RELEASE_MAX, VOLUMES_MAX } from '@/media/sagas';

export const SAGA_HEADERS = {
    add: 'Aggiungi saga',
    edit: 'Modifica saga',
};

const json = { 'content-type': 'application/json' };

export function SagaForm({
    id,
    title,
    onSaved,
    onDeleted,
    style,
}: {
    /** The saga to edit; without it the form adds a new one. */
    id?: string;
    /** Shown above the fields when the page has no header of its own. */
    title?: string;
    /** After a save, an archive or a restore. */
    onSaved: (saved: Saga) => void;
    onDeleted: () => void;
    style?: StyleProp<ViewStyle>;
}) {
    const theme = useTheme();
    // undefined while loading, null when the saga is gone.
    const [saga, setSaga] = useState<Saga | null | undefined>(
        id ? undefined : null
    );
    const [name, setName] = useState('');
    const [author, setAuthor] = useState('');
    const [volumes, setVolumes] = useState('');
    const [nextRelease, setNextRelease] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        apiFetch('/api/sagas')
            .then((res) => (res.ok ? res.json() : Promise.reject()))
            .then((sagas: Saga[]) => {
                if (cancelled) return;
                const found = sagas.find((s) => s.id === id) ?? null;
                setSaga(found);
                if (!found) return;
                setName(found.name);
                setAuthor(found.author ?? '');
                setVolumes(String(found.volumes));
                setNextRelease(found.nextRelease ?? '');
            })
            .catch(() => {
                if (cancelled) return;
                setSaga(null);
                setError('Non riesco a caricare la saga.');
            });
        return () => {
            cancelled = true;
        };
    }, [id]);

    /** Sends a change; on failure shows `failure` and returns null. */
    const send = async (
        path: string,
        method: string,
        body?: object,
        failure = 'Non riesco a salvare la saga.'
    ): Promise<Response | null> => {
        setBusy(true);
        setError(null);
        let res: Response | null = null;
        try {
            res = await apiFetch(path, {
                method,
                headers: body ? json : undefined,
                body: body ? JSON.stringify(body) : undefined,
            });
        } catch {
            res = null;
        }
        setBusy(false);
        if (res?.ok) return res;
        setError(failure);
        return null;
    };

    const save = async () => {
        const trimmed = name.trim();
        if (!trimmed || trimmed.length > NAME_MAX) {
            return setError(`Scrivi un nome di massimo ${NAME_MAX} caratteri.`);
        }
        const planned = parseCount(volumes, VOLUMES_MAX);
        if (!planned) {
            return setError(`I volumi vanno da 1 a ${VOLUMES_MAX}.`);
        }
        if (nextRelease.trim().length > RELEASE_MAX) {
            return setError(
                `L’uscita può avere al massimo ${RELEASE_MAX} caratteri.`
            );
        }

        const fields = {
            name: trimmed,
            author,
            volumes: planned,
            nextRelease,
        };
        const res = saga
            ? await send(`/api/sagas/${saga.id}`, 'PATCH', fields)
            : await send('/api/sagas', 'POST', fields);
        if (res) onSaved(await res.json());
    };

    const archive = async (archived: boolean) => {
        const res = await send(`/api/sagas/${saga!.id}`, 'PATCH', { archived });
        if (!res) return;
        // On desktop the form stays open beside the list.
        const saved = await res.json();
        setSaga(saved);
        onSaved(saved);
    };

    const remove = async () => {
        const path = `/api/sagas/${saga!.id}`;
        const failure = 'Non riesco a eliminare la saga.';
        if (await send(path, 'DELETE', undefined, failure)) onDeleted();
    };

    if (saga === undefined) {
        return (
            <ActivityIndicator color={theme.textMuted} style={styles.loading} />
        );
    }
    if (id && !saga) {
        return (
            <ThemedText themeColor="textMuted" style={styles.missing}>
                {error ?? 'Questa saga non c’è più.'}
            </ThemedText>
        );
    }

    return (
        <ScrollView contentContainerStyle={[styles.body, style]}>
            {title && <ThemedText type="title">{title}</ThemedText>}
            <TextField
                label="Nome"
                value={name}
                onChange={setName}
                placeholder="Stormlight"
            />
            <TextField
                label="Autore"
                value={author}
                onChange={setAuthor}
                placeholder="Brandon Sanderson"
            />
            <TextField
                label="Volumi previsti"
                value={volumes}
                onChange={setVolumes}
                placeholder="10"
                keyboardType="number-pad"
            />
            <TextField
                label="Prossima uscita"
                value={nextRelease}
                onChange={setNextRelease}
                placeholder="marzo 2027"
            />
            {saga?.archivedAt && (
                <Pressable
                    onPress={() => archive(false)}
                    disabled={busy}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                        styles.link,
                        { borderColor: theme.border },
                        pressed && styles.pressed,
                    ]}>
                    <ThemedText>Ripristina</ThemedText>
                </Pressable>
            )}
            <FormActions
                error={error}
                busy={busy}
                onSave={save}
                onDelete={saga ? remove : undefined}
                name={`“${name}”`}
                extra={
                    saga && !saga.archivedAt
                        ? {
                              label: 'Archivia',
                              question: `Archiviare “${name}”?`,
                              onConfirm: () => archive(true),
                          }
                        : undefined
                }
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    loading: {
        paddingVertical: Spacing.three,
    },
    missing: {
        padding: Spacing.four,
        textAlign: 'center',
    },
    body: {
        flexGrow: 1,
        padding: Spacing.four,
        gap: Spacing.three,
    },
    link: {
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        borderRadius: 999,
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    pressed: {
        opacity: 0.6,
    },
});
