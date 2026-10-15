/**
 * One gift recipient: ideas on top with a field to add one, then the gifts
 * already given by year. The circle of an idea marks it given, a tap on a
 * gift opens its form, and "Modifica" renames or deletes the recipient.
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
import { GiftSheet, GiveSheet } from '@/gifts/gift-sheet';
import { giftDetail, groupByYear } from '@/gifts/list';
import { useFocusRing } from '@/hooks/use-focus-ring';
import { type Gift, useRecipient } from '@/hooks/use-recipient';
import { useTheme } from '@/hooks/use-theme';

export function RecipientDetail({
    id,
    onChanged,
    onRemoved,
    panel,
}: {
    id: string;
    onChanged?: () => void;
    onRemoved: () => void;
    /** Drawn in the desktop panel beside the list, without the back header. */
    panel?: boolean;
}) {
    const theme = useTheme();
    const { recipient, error, add, update, removeGift, rename, remove } =
        useRecipient(id, onChanged);
    const [editing, setEditing] = useState(false);
    const [sheet, setSheet] = useState<
        | { kind: 'edit' | 'give'; gift: Gift }
        | { kind: 'new'; given: boolean }
        | null
    >(null);
    const closeSheet = () => setSheet(null);

    const ideas = (recipient?.gifts ?? [])
        .filter((g) => g.givenOn === null)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const row = (g: Gift) => (
        <GiftRow
            key={g.id}
            gift={g}
            onOpen={() => setSheet({ kind: 'edit', gift: g })}
            onGive={() => setSheet({ kind: 'give', gift: g })}
        />
    );
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
                contentContainerStyle={panel ? styles.desktopBody : styles.body}
                keyboardShouldPersistTaps="handled">
                {panel && (
                    <View style={styles.titleRow}>
                        <ThemedText type="title" style={styles.grow}>
                            {recipient.name}
                        </ThemedText>
                        <Pressable
                            onPress={() => setEditing(true)}
                            accessibilityRole="link"
                            hitSlop={Spacing.two}
                            style={({ pressed }) => pressed && styles.pressed}>
                            <ThemedText themeColor="accent">
                                Modifica
                            </ThemedText>
                        </Pressable>
                    </View>
                )}
                <ThemedText type="subtitle">Idee</ThemedText>
                {ideas.map(row)}
                <AddField onAdd={(name) => add({ name })} />

                <View style={styles.sectionRow}>
                    <ThemedText type="subtitle" style={styles.grow}>
                        Fatti
                    </ThemedText>
                    <Pressable
                        onPress={() => setSheet({ kind: 'new', given: true })}
                        accessibilityRole="button"
                        hitSlop={Spacing.two}
                        style={({ pressed }) => pressed && styles.pressed}>
                        <ThemedText themeColor="accent">
                            + Aggiungi regalo fatto
                        </ThemedText>
                    </Pressable>
                </View>
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
                        {gifts.map(row)}
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
            {panel ? (
                <View style={styles.panel}>{body}</View>
            ) : (
                <>
                    <ScreenHeader
                        title={recipient?.name ?? ''}
                        backTo="/regali"
                        link={
                            recipient
                                ? {
                                      label: 'Modifica',
                                      onPress: () => setEditing(true),
                                  }
                                : undefined
                        }
                    />
                    {body}
                </>
            )}
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
            {sheet?.kind === 'new' && (
                <GiftSheet
                    given={sheet.given}
                    onSave={add}
                    onClose={closeSheet}
                />
            )}
            {sheet?.kind === 'edit' && (
                <GiftSheet
                    gift={sheet.gift}
                    onSave={(changes) => update(sheet.gift, changes)}
                    onRemove={() => removeGift(sheet.gift)}
                    onClose={closeSheet}
                />
            )}
            {sheet?.kind === 'give' && (
                <GiveSheet
                    gift={sheet.gift}
                    onGive={(changes) => update(sheet.gift, changes)}
                    onClose={closeSheet}
                />
            )}
        </>
    );
}

function GiftRow({
    gift,
    onOpen,
    onGive,
}: {
    gift: Gift;
    onOpen: () => void;
    onGive: () => void;
}) {
    const theme = useTheme();
    const given = gift.givenOn !== null;
    const detail = giftDetail(gift);

    return (
        <View
            style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
            <Pressable
                onPress={onGive}
                disabled={given}
                accessibilityRole="checkbox"
                aria-checked={given}
                accessibilityLabel={`Segna ${gift.name} come regalato`}
                hitSlop={Spacing.two}
                style={({ pressed }) => pressed && styles.pressed}>
                <View
                    style={[
                        styles.circle,
                        { borderColor: theme.accent },
                        given && { backgroundColor: theme.accent },
                    ]}
                />
            </Pressable>
            <Pressable
                onPress={onOpen}
                accessibilityRole="button"
                accessibilityHint="Modifica il regalo"
                style={({ pressed }) => [
                    styles.rowMain,
                    pressed && styles.pressed,
                ]}>
                <ThemedText>{gift.name}</ThemedText>
                {detail !== '' && (
                    <ThemedText type="small" themeColor="textMuted">
                        {detail}
                    </ThemedText>
                )}
            </Pressable>
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

    const submit = async () => {
        const value = name.trim();
        if (!value) return;
        setName('');
        // Give the idea back unless something new was typed meanwhile.
        if (!(await onAdd(value))) setName((current) => current || value);
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
    panel: {
        flex: 1,
        paddingTop: 32,
        paddingHorizontal: 40,
    },
    desktopBody: {
        paddingBottom: 32,
        gap: Spacing.two,
        maxWidth: 720,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        marginBottom: Spacing.two,
    },
    sectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        marginTop: Spacing.three,
    },
    grow: {
        flex: 1,
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
