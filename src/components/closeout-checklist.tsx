/**
 * The Closeout tab: the month's checklist grouped by area, in the order of
 * each area's first item. A tap ticks a row, × removes it, and each area ends
 * with a field to add one more.
 */

import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { ChecklistItem } from '@/hooks/use-closeout-month';
import { useFocusRing } from '@/hooks/use-focus-ring';
import { useTheme } from '@/hooks/use-theme';

const MAX_AREA = 40;
const MAX_TEXT = 200;

type AddItem = (area: string, text: string) => Promise<boolean>;

export function CloseoutChecklist({
    items,
    error,
    onToggle,
    onRemove,
    onAdd,
}: {
    items: ChecklistItem[];
    error: string | null;
    onToggle: (item: ChecklistItem) => void;
    onRemove: (item: ChecklistItem) => void;
    onAdd: AddItem;
}) {
    const [newArea, setNewArea] = useState<string | null>(null);
    const [pendingArea, setPendingArea] = useState<string | null>(null);

    const groups = new Map<string, ChecklistItem[]>();
    for (const item of items) {
        groups.set(item.area, [...(groups.get(item.area) ?? []), item]);
    }

    const done = items.filter((item) => item.done).length;

    const submitArea = () => {
        const area = newArea?.trim();
        setNewArea(null);
        if (area && !groups.has(area)) setPendingArea(area);
    };

    const addFirst: AddItem = async (area, text) => {
        const added = await onAdd(area, text);
        if (added) setPendingArea(null);
        return added;
    };

    return (
        <View style={styles.list}>
            <ThemedText themeColor="textMuted">
                {done}/{items.length} fatti
            </ThemedText>
            {error && (
                <ThemedText type="small" themeColor="danger">
                    {error}
                </ThemedText>
            )}

            {[...groups].map(([area, areaItems]) => (
                <View key={area} style={styles.group}>
                    <ThemedText type="subtitle">{area}</ThemedText>
                    {areaItems.map((item) => (
                        <Row
                            key={item.id}
                            item={item}
                            onToggle={onToggle}
                            onRemove={onRemove}
                        />
                    ))}
                    <AddField area={area} onAdd={onAdd} />
                </View>
            ))}

            {pendingArea !== null && (
                <View style={styles.group}>
                    <ThemedText type="subtitle">{pendingArea}</ThemedText>
                    <AddField
                        area={pendingArea}
                        onAdd={addFirst}
                        startOpen
                        onClose={() => setPendingArea(null)}
                    />
                </View>
            )}

            {newArea === null ? (
                <Pressable
                    onPress={() => setNewArea('')}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                        styles.add,
                        pressed && styles.pressed,
                    ]}>
                    <ThemedText themeColor="accent">+ Nuova area</ThemedText>
                </Pressable>
            ) : (
                <Field
                    value={newArea}
                    onChangeText={setNewArea}
                    onSubmit={submitArea}
                    onBlur={() => setNewArea(null)}
                    placeholder="Nome dell'area"
                    maxLength={MAX_AREA}
                />
            )}
        </View>
    );
}

function Row({
    item,
    onToggle,
    onRemove,
}: {
    item: ChecklistItem;
    onToggle: (item: ChecklistItem) => void;
    onRemove: (item: ChecklistItem) => void;
}) {
    const theme = useTheme();

    return (
        <View
            style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
            <Pressable
                onPress={() => onToggle(item)}
                accessibilityRole="checkbox"
                aria-checked={item.done}
                style={({ pressed }) => [
                    styles.rowMain,
                    pressed && styles.pressed,
                ]}>
                <View
                    style={[
                        styles.box,
                        { borderColor: theme.accent },
                        item.done && { backgroundColor: theme.accent },
                    ]}>
                    {item.done && (
                        <ThemedText
                            type="small"
                            style={[styles.tick, { color: theme.onAccent }]}>
                            ✓
                        </ThemedText>
                    )}
                </View>
                <ThemedText
                    themeColor={item.done ? 'textMuted' : 'text'}
                    style={[styles.rowText, item.done && styles.doneText]}>
                    {item.text}
                </ThemedText>
            </Pressable>
            <Pressable
                onPress={() => onRemove(item)}
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

/**
 * "+ Aggiungi", which opens a field. It stays open after each item so
 * several can go in a row, and closes when it loses focus empty.
 */
function AddField({
    area,
    onAdd,
    startOpen,
    onClose,
}: {
    area: string;
    onAdd: AddItem;
    startOpen?: boolean;
    onClose?: () => void;
}) {
    const [text, setText] = useState<string | null>(startOpen ? '' : null);
    const [saving, setSaving] = useState(false);

    if (text === null) {
        return (
            <Pressable
                onPress={() => setText('')}
                accessibilityRole="button"
                style={({ pressed }) => [
                    styles.add,
                    pressed && styles.pressed,
                ]}>
                <ThemedText themeColor="accent">+ Aggiungi</ThemedText>
            </Pressable>
        );
    }

    const submit = async () => {
        const value = text.trim();
        if (!value || saving) return;
        setSaving(true);
        if (await onAdd(area, value)) setText('');
        setSaving(false);
    };

    const close = () => {
        if (text.trim() || saving) return;
        setText(null);
        onClose?.();
    };

    return (
        <Field
            value={text}
            onChangeText={setText}
            onSubmit={submit}
            onBlur={close}
            placeholder="Nuova voce"
            maxLength={MAX_TEXT}
        />
    );
}

function Field({
    value,
    onChangeText,
    onSubmit,
    onBlur,
    placeholder,
    maxLength,
}: {
    value: string;
    onChangeText: (value: string) => void;
    onSubmit: () => void;
    onBlur: () => void;
    placeholder: string;
    maxLength: number;
}) {
    const theme = useTheme();
    const focus = useFocusRing();

    return (
        <TextInput
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmit}
            onFocus={focus.onFocus}
            onBlur={() => {
                focus.onBlur();
                onBlur();
            }}
            placeholder={placeholder}
            placeholderTextColor={theme.textMuted}
            accessibilityLabel={placeholder}
            maxLength={maxLength}
            autoFocus
            returnKeyType="done"
            // Keeps the keyboard up after Enter: the first for web, the
            // second for native.
            blurOnSubmit={false}
            submitBehavior="submit"
            style={[
                styles.input,
                {
                    color: theme.text,
                    backgroundColor: theme.backgroundElement,
                },
                focus.ring,
            ]}
        />
    );
}

const styles = StyleSheet.create({
    list: {
        gap: Spacing.four,
    },
    group: {
        gap: Spacing.two,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
    },
    rowMain: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        paddingVertical: Spacing.three,
        paddingLeft: Spacing.three,
    },
    box: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tick: {
        fontFamily: 'Karla_700Bold',
        lineHeight: 16,
    },
    rowText: {
        flex: 1,
    },
    doneText: {
        textDecorationLine: 'line-through',
    },
    remove: {
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.three,
    },
    add: {
        alignSelf: 'flex-start',
        paddingVertical: Spacing.two,
    },
    input: {
        fontSize: 16,
        borderRadius: 12,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.three,
    },
    pressed: {
        opacity: 0.6,
    },
});
