/**
 * One gift recipient: ideas on top with a field to add one, then the gifts
 * already given by year. "Modifica" renames or deletes the recipient.
 */

import { useState } from 'react';
import {
    ActivityIndicator,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';

import { ScreenHeader } from '@/components/screen-header';
import { Sheet } from '@/components/sheet';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { giftDetail, groupByYear } from '@/gifts/list';
import { useFocusRing } from '@/hooks/use-focus-ring';
import { type Gift, useRecipient } from '@/hooks/use-recipient';
import { useTheme } from '@/hooks/use-theme';

export function RecipientDetail({
    id,
    onChanged,
    onRemoved,
}: {
    id: string;
    onChanged?: () => void;
    onRemoved: () => void;
}) {
    const theme = useTheme();
    const { recipient, error, addIdea, rename, remove } = useRecipient(
        id,
        onChanged
    );
    const [editing, setEditing] = useState(false);

    const ideas = recipient?.gifts.filter((g) => g.givenOn === null) ?? [];
    const years = groupByYear(recipient?.gifts ?? []);

    const body =
        recipient === undefined ? (
            <ActivityIndicator color={theme.textMuted} style={styles.message} />
        ) : recipient === null ? (
            <ThemedText themeColor="textMuted" style={styles.message}>
                {error ?? 'Questa persona non esiste più.'}
            </ThemedText>
        ) : (
            <ScrollView
                contentContainerStyle={styles.body}
                keyboardShouldPersistTaps="handled">
                <ThemedText type="subtitle">Idee</ThemedText>
                {ideas.map((g) => (
                    <GiftRow key={g.id} gift={g} />
                ))}
                <AddField onAdd={addIdea} />

                <ThemedText type="subtitle" style={styles.section}>
                    Fatti
                </ThemedText>
                {years.length === 0 && (
                    <ThemedText themeColor="textMuted">
                        Ancora nessun regalo fatto.
                    </ThemedText>
                )}
                {years.map(({ year, gifts }) => (
                    <View key={year} style={styles.year}>
                        <ThemedText type="small" themeColor="textMuted">
                            {year}
                        </ThemedText>
                        {gifts.map((g) => (
                            <GiftRow key={g.id} gift={g} />
                        ))}
                    </View>
                ))}
                {error && !editing && (
                    <ThemedText type="small" themeColor="danger">
                        {error}
                    </ThemedText>
                )}
            </ScrollView>
        );

    return (
        <>
            <ScreenHeader
                title={recipient?.name ?? ''}
                backTo="/regali"
                link={
                    recipient
                        ? { label: 'Modifica', onPress: () => setEditing(true) }
                        : undefined
                }
            />
            {body}
            {editing && recipient && (
                <RecipientSheet
                    name={recipient.name}
                    error={error}
                    onRename={rename}
                    onRemove={async () => {
                        if (await remove()) onRemoved();
                    }}
                    onClose={() => setEditing(false)}
                />
            )}
        </>
    );
}

function GiftRow({ gift }: { gift: Gift }) {
    const theme = useTheme();
    const given = gift.givenOn !== null;
    const detail = giftDetail(gift);

    return (
        <View
            style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
            <View
                style={[
                    styles.circle,
                    { borderColor: theme.accent },
                    given && { backgroundColor: theme.accent },
                ]}
            />
            <View style={styles.rowMain}>
                <ThemedText>{gift.name}</ThemedText>
                {detail !== '' && (
                    <ThemedText type="small" themeColor="textMuted">
                        {detail}
                    </ThemedText>
                )}
            </View>
            {gift.link && (
                <Pressable
                    onPress={() => Linking.openURL(gift.link!)}
                    accessibilityRole="link"
                    accessibilityLabel={`Apri il link di ${gift.name}`}
                    hitSlop={Spacing.two}
                    style={({ pressed }) => [
                        styles.link,
                        pressed && styles.pressed,
                    ]}>
                    <ThemedText themeColor="accent">↗</ThemedText>
                </Pressable>
            )}
        </View>
    );
}

/** Stays focused after each idea so several can go in a row. */
function AddField({ onAdd }: { onAdd: (name: string) => Promise<boolean> }) {
    const theme = useTheme();
    const focus = useFocusRing();
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);

    const submit = async () => {
        const value = name.trim();
        if (!value || saving) return;
        setSaving(true);
        if (await onAdd(value)) setName('');
        setSaving(false);
    };

    return (
        <TextInput
            value={name}
            onChangeText={setName}
            onSubmitEditing={submit}
            onFocus={focus.onFocus}
            onBlur={focus.onBlur}
            placeholder="Aggiungi idea…"
            placeholderTextColor={theme.textMuted}
            accessibilityLabel="Aggiungi idea"
            maxLength={200}
            returnKeyType="done"
            blurOnSubmit={false}
            submitBehavior="submit"
            style={[
                styles.input,
                { color: theme.text, backgroundColor: theme.backgroundElement },
                focus.ring,
            ]}
        />
    );
}

function RecipientSheet({
    name: current,
    error,
    onRename,
    onRemove,
    onClose,
}: {
    name: string;
    error: string | null;
    onRename: (name: string) => Promise<boolean>;
    onRemove: () => void;
    onClose: () => void;
}) {
    const theme = useTheme();
    const focus = useFocusRing();
    const [name, setName] = useState(current);
    const [confirming, setConfirming] = useState(false);
    const valid = name.trim() !== '';

    const save = async () => {
        const value = name.trim();
        if (!value) return;
        if (value === current || (await onRename(value))) onClose();
    };

    return (
        <Sheet visible onClose={onClose} style={styles.sheet}>
            <TextInput
                value={name}
                onChangeText={setName}
                onSubmitEditing={save}
                onFocus={focus.onFocus}
                onBlur={focus.onBlur}
                maxLength={100}
                accessibilityLabel="Nome"
                style={[
                    styles.input,
                    { color: theme.text, backgroundColor: theme.background },
                    focus.ring,
                ]}
            />
            {error && (
                <ThemedText type="small" themeColor="danger">
                    {error}
                </ThemedText>
            )}
            <Pressable
                onPress={save}
                disabled={!valid}
                accessibilityRole="button"
                style={({ pressed }) => [
                    styles.save,
                    { backgroundColor: theme.accent },
                    !valid && styles.disabled,
                    pressed && styles.pressed,
                ]}>
                <ThemedText
                    style={[styles.saveText, { color: theme.onAccent }]}>
                    Salva
                </ThemedText>
            </Pressable>
            <View style={styles.remove}>
                {confirming ? (
                    <>
                        <ThemedText>
                            Eliminare {current} e i suoi regali?
                        </ThemedText>
                        <Pressable
                            onPress={onRemove}
                            accessibilityRole="button">
                            <ThemedText themeColor="danger">Sì</ThemedText>
                        </Pressable>
                        <Pressable
                            onPress={() => setConfirming(false)}
                            accessibilityRole="button">
                            <ThemedText>No</ThemedText>
                        </Pressable>
                    </>
                ) : (
                    <Pressable
                        onPress={() => setConfirming(true)}
                        accessibilityRole="button">
                        <ThemedText themeColor="danger">Elimina</ThemedText>
                    </Pressable>
                )}
            </View>
        </Sheet>
    );
}

const styles = StyleSheet.create({
    message: {
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.three,
        textAlign: 'center',
    },
    body: {
        padding: Spacing.four,
        gap: Spacing.two,
    },
    section: {
        marginTop: Spacing.three,
    },
    year: {
        gap: Spacing.two,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingLeft: Spacing.three,
    },
    circle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
    },
    rowMain: {
        flex: 1,
        paddingVertical: Spacing.three,
        paddingHorizontal: Spacing.three,
        gap: Spacing.one,
    },
    link: {
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.three,
    },
    input: {
        fontSize: 16,
        borderRadius: 12,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.three,
    },
    sheet: {
        gap: Spacing.three,
        padding: Spacing.four,
    },
    save: {
        paddingVertical: Spacing.three,
        borderRadius: 14,
        alignItems: 'center',
    },
    saveText: {
        fontFamily: 'Karla_600SemiBold',
        fontSize: 18,
        lineHeight: 24,
    },
    remove: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: Spacing.three,
        padding: Spacing.two,
    },
    disabled: {
        opacity: 0.4,
    },
    pressed: {
        opacity: 0.6,
    },
});
