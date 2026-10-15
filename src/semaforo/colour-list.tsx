/**
 * One Semaforo colour: a header with its stripe and label, the items with ×,
 * and a field that adds on Enter. On the phone a tap on the header closes it.
 */

import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useFocusRing } from '@/hooks/use-focus-ring';
import type { Item } from '@/hooks/use-semaforo';
import { useTheme } from '@/hooks/use-theme';

import { type COLOURS, NAME_MAX } from './colours';

interface ColourListProps {
    colour: (typeof COLOURS)[number];
    items: Item[];
    /** Undefined on desktop, where the four columns never close. */
    open?: boolean;
    onToggle?: () => void;
    onAdd: (name: string) => Promise<boolean>;
    onRemove: (item: Item) => void;
}

export function ColourList({
    colour,
    items,
    open,
    onToggle,
    onAdd,
    onRemove,
}: ColourListProps) {
    const theme = useTheme();
    const focus = useFocusRing();
    const [draft, setDraft] = useState('');
    const tone = theme[colour.tone];
    const collapsible = open !== undefined;

    const submit = async () => {
        const name = draft.trim();
        if (!name) return;
        setDraft('');
        // Give the name back unless something new was typed meanwhile.
        if (!(await onAdd(name))) setDraft((current) => current || name);
    };

    const header = (
        <>
            <ThemedText type="subtitle" style={[styles.grow, { color: tone }]}>
                {colour.label}
            </ThemedText>
            <ThemedText themeColor="textMuted">{items.length}</ThemedText>
            {collapsible && (
                <SymbolView
                    name={
                        open
                            ? {
                                  ios: 'chevron.down',
                                  android: 'expand_more',
                                  web: 'expand_more',
                              }
                            : {
                                  ios: 'chevron.right',
                                  android: 'chevron_right',
                                  web: 'chevron_right',
                              }
                    }
                    tintColor={theme.textMuted}
                    size={24}
                />
            )}
        </>
    );

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: theme.backgroundElement,
                    borderTopColor: tone,
                },
            ]}>
            {collapsible ? (
                <Pressable
                    onPress={onToggle}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: open }}
                    style={({ pressed }) => [
                        styles.header,
                        pressed && styles.pressed,
                    ]}>
                    {header}
                </Pressable>
            ) : (
                <View style={styles.header}>{header}</View>
            )}
            {(open ?? true) && (
                <>
                    {items.map((item) => (
                        <View
                            key={item.id}
                            style={[
                                styles.row,
                                { borderTopColor: theme.border },
                            ]}>
                            <ThemedText style={styles.grow}>
                                {item.name}
                            </ThemedText>
                            <Pressable
                                onPress={() => onRemove(item)}
                                accessibilityRole="button"
                                accessibilityLabel={`Elimina «${item.name}»`}
                                hitSlop={Spacing.two}
                                style={({ pressed }) => [
                                    styles.remove,
                                    pressed && styles.pressed,
                                ]}>
                                <ThemedText themeColor="textMuted">
                                    ×
                                </ThemedText>
                            </Pressable>
                        </View>
                    ))}
                    <TextInput
                        value={draft}
                        onChangeText={setDraft}
                        onSubmitEditing={submit}
                        // Keeps the keyboard up after Enter: the first for
                        // web, the second for native.
                        blurOnSubmit={false}
                        submitBehavior="submit"
                        onFocus={focus.onFocus}
                        onBlur={focus.onBlur}
                        placeholder="Aggiungi…"
                        placeholderTextColor={theme.textMuted}
                        maxLength={NAME_MAX}
                        returnKeyType="done"
                        accessibilityLabel={`Aggiungi a ${colour.label}`}
                        style={[
                            styles.input,
                            { color: theme.text, borderColor: theme.border },
                            focus.ring,
                        ]}
                    />
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        borderTopWidth: 4,
        padding: Spacing.three,
        gap: Spacing.two,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: StyleSheet.hairlineWidth,
        paddingTop: Spacing.two,
    },
    remove: {
        paddingHorizontal: Spacing.two,
    },
    input: {
        fontSize: 16,
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
    },
    grow: {
        flex: 1,
    },
    pressed: {
        opacity: 0.6,
    },
});
