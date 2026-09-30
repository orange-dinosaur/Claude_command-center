/**
 * A bucket list season: its items and a field to add one. The box ticks an
 * item with today's date, "fatto il …" opens the calendar to change it, a tap
 * on the text edits it in place, and × removes the item.
 */

import { useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';

import { seasonLabel } from '@/bucket/season';
import { DateField } from '@/components/date-field';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { formatShortDay, todayDay } from '@/dates';
import { type BucketItem, useBucketSeason } from '@/hooks/use-bucket-season';
import { useFocusRing } from '@/hooks/use-focus-ring';
import { useTheme } from '@/hooks/use-theme';

const MAX_TEXT = 200;

export function SeasonDetail({
    id,
    onItemsChanged,
    panel,
}: {
    id: string;
    onItemsChanged?: () => void;
    /** Drawn in the desktop panel beside the list, without the back header. */
    panel?: boolean;
}) {
    const theme = useTheme();
    const { season, error, add, update, remove } = useBucketSeason(
        id,
        onItemsChanged
    );

    const label = season ? seasonLabel(season) : '';

    const body =
        season === undefined ? (
            <ActivityIndicator color={theme.textMuted} style={styles.message} />
        ) : season === null ? (
            <ThemedText themeColor="textMuted" style={styles.message}>
                {error ?? 'Questa stagione non esiste più.'}
            </ThemedText>
        ) : (
            <ScrollView
                contentContainerStyle={panel ? styles.desktopBody : styles.body}
                keyboardShouldPersistTaps="handled">
                {panel && <ThemedText type="title">{label}</ThemedText>}
                <AddField onAdd={add} />
                {season.items.length === 0 && (
                    <ThemedText themeColor="textMuted">
                        Ancora niente in lista per questa stagione.
                    </ThemedText>
                )}
                {season.items.map((item) => (
                    <ItemRow
                        key={item.id}
                        item={item}
                        onUpdate={(changes) => update(item, changes)}
                        onRemove={() => remove(item)}
                    />
                ))}
                {error && (
                    <ThemedText type="small" themeColor="danger">
                        {error}
                    </ThemedText>
                )}
            </ScrollView>
        );

    if (panel) return <View style={styles.panel}>{body}</View>;

    return (
        <>
            <ScreenHeader title={label} backTo="/bucket-list" />
            {body}
        </>
    );
}

function ItemRow({
    item,
    onUpdate,
    onRemove,
}: {
    item: BucketItem;
    onUpdate: (changes: { text?: string; doneOn?: string | null }) => void;
    onRemove: () => void;
}) {
    const theme = useTheme();
    const focus = useFocusRing();
    const [editing, setEditing] = useState<string | null>(null);
    const done = item.doneOn !== null;

    const save = () => {
        const text = editing?.trim();
        setEditing(null);
        if (text && text !== item.text) onUpdate({ text });
    };

    return (
        <View
            style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
            <Pressable
                onPress={() => onUpdate({ doneOn: done ? null : todayDay() })}
                accessibilityRole="checkbox"
                aria-checked={done}
                accessibilityLabel={item.text}
                hitSlop={Spacing.two}
                style={({ pressed }) => [
                    styles.boxHit,
                    pressed && styles.pressed,
                ]}>
                <View
                    style={[
                        styles.box,
                        { borderColor: theme.accent },
                        done && { backgroundColor: theme.accent },
                    ]}>
                    {done && (
                        <ThemedText
                            type="small"
                            style={[styles.tick, { color: theme.onAccent }]}>
                            ✓
                        </ThemedText>
                    )}
                </View>
            </Pressable>

            <View style={styles.rowMain}>
                {editing === null ? (
                    <Pressable
                        onPress={() => setEditing(item.text)}
                        accessibilityRole="button"
                        accessibilityHint="Modifica il testo">
                        <ThemedText
                            themeColor={done ? 'textMuted' : 'text'}
                            style={done && styles.doneText}>
                            {item.text}
                        </ThemedText>
                    </Pressable>
                ) : (
                    <TextInput
                        value={editing}
                        onChangeText={setEditing}
                        onSubmitEditing={save}
                        onFocus={focus.onFocus}
                        onBlur={() => {
                            focus.onBlur();
                            save();
                        }}
                        accessibilityLabel="Testo della voce"
                        maxLength={MAX_TEXT}
                        autoFocus
                        returnKeyType="done"
                        style={[styles.editInput, { color: theme.text }]}
                    />
                )}
                {item.doneOn && (
                    <DateField
                        value={item.doneOn}
                        onChange={(doneOn) => doneOn && onUpdate({ doneOn })}
                        label="Data in cui è stata fatta"
                        pastOnly>
                        <ThemedText type="small" themeColor="accent">
                            fatto il {formatShortDay(item.doneOn)}
                        </ThemedText>
                    </DateField>
                )}
            </View>

            {item.addedBy && (
                <View
                    style={[styles.initial, { borderColor: theme.textMuted }]}>
                    <ThemedText type="small" themeColor="textMuted">
                        {item.addedBy}
                    </ThemedText>
                </View>
            )}

            <Pressable
                onPress={onRemove}
                accessibilityRole="button"
                accessibilityLabel={`Elimina ${item.text}`}
                hitSlop={Spacing.two}
                style={({ pressed }) => [
                    styles.remove,
                    pressed && styles.pressed,
                ]}>
                <ThemedText themeColor="textMuted">×</ThemedText>
            </Pressable>
        </View>
    );
}

/** Stays focused after each item so several can go in a row. */
function AddField({ onAdd }: { onAdd: (text: string) => Promise<boolean> }) {
    const theme = useTheme();
    const focus = useFocusRing();
    const [text, setText] = useState('');
    const [saving, setSaving] = useState(false);

    const submit = async () => {
        const value = text.trim();
        if (!value || saving) return;
        setSaving(true);
        if (await onAdd(value)) setText('');
        setSaving(false);
    };

    return (
        <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={submit}
            onFocus={focus.onFocus}
            onBlur={focus.onBlur}
            placeholder="Aggiungi una voce"
            placeholderTextColor={theme.textMuted}
            accessibilityLabel="Aggiungi una voce"
            maxLength={MAX_TEXT}
            returnKeyType="done"
            // Keeps the keyboard up after Enter: the first for web, the
            // second for native.
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
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
    },
    boxHit: {
        paddingVertical: Spacing.three,
        paddingLeft: Spacing.three,
        paddingRight: Spacing.two,
    },
    box: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tick: {
        fontFamily: 'Karla_700Bold',
        lineHeight: 16,
    },
    rowMain: {
        flex: 1,
        paddingVertical: Spacing.three,
        paddingLeft: Spacing.two,
        gap: Spacing.one,
        alignItems: 'flex-start',
    },
    doneText: {
        textDecorationLine: 'line-through',
    },
    editInput: {
        alignSelf: 'stretch',
        fontSize: 16,
        padding: 0,
    },
    initial: {
        minWidth: 24,
        height: 24,
        paddingHorizontal: 6,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: Spacing.two,
    },
    remove: {
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.three,
    },
    input: {
        fontSize: 16,
        borderRadius: 12,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.three,
        marginBottom: Spacing.two,
    },
    pressed: {
        opacity: 0.6,
    },
});
