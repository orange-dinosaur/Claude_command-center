/**
 * The pieces of a desktop list page: the list column beside the detail panel,
 * its rows and its add button. The phone lists use the rows and button too.
 */

import { type ReactNode } from 'react';
import {
    Pressable,
    StyleSheet,
    View,
    type StyleProp,
    type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type HeaderLink = { label: string; onPress: () => void };

/** The list column on desktop: title and controls on top, then the list. */
export function ListColumn({
    title,
    link,
    header,
    width = 360,
    children,
}: {
    title: string;
    /** Text links at the right of the title. */
    link?: HeaderLink | HeaderLink[];
    /** Controls under the title, such as tabs and the add button. */
    header?: ReactNode;
    width?: number;
    children: ReactNode;
}) {
    const theme = useTheme();

    return (
        <View
            style={[styles.column, { width, borderRightColor: theme.border }]}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <ThemedText type="title" style={styles.grow}>
                        {title}
                    </ThemedText>
                    {link &&
                        [link].flat().map((l) => (
                            <Pressable
                                key={l.label}
                                onPress={l.onPress}
                                accessibilityRole="link"
                                hitSlop={Spacing.two}
                                style={({ pressed }) =>
                                    pressed && styles.pressed
                                }>
                                <ThemedText style={{ color: theme.accent }}>
                                    {l.label}
                                </ThemedText>
                            </Pressable>
                        ))}
                </View>
                {header}
            </View>
            {children}
        </View>
    );
}

export function AddButton({
    label = 'Aggiungi',
    onPress,
    disabled,
    style,
}: {
    label?: string;
    onPress: () => void;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
}) {
    const theme = useTheme();

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            style={({ pressed }) => [
                styles.addButton,
                style,
                { backgroundColor: theme.accent },
                pressed && styles.pressed,
            ]}>
            <ThemedText style={[styles.buttonText, { color: theme.onAccent }]}>
                {label}
            </ThemedText>
        </Pressable>
    );
}

export function ListRow({
    selected = false,
    onPress,
    style,
    children,
}: {
    selected?: boolean;
    onPress: () => void;
    style?: StyleProp<ViewStyle>;
    children: ReactNode;
}) {
    const theme = useTheme();

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
                styles.row,
                {
                    backgroundColor: selected
                        ? theme.accent
                        : theme.backgroundElement,
                },
                style,
                pressed && styles.pressed,
            ]}>
            {children}
        </Pressable>
    );
}

/** Muted text, or slightly faded `onAccent` on a selected row. */
export function Secondary({
    selected,
    small,
    children,
}: {
    selected: boolean;
    small?: boolean;
    children: ReactNode;
}) {
    return (
        <ThemedText
            type={small ? 'small' : 'default'}
            themeColor={selected ? 'onAccent' : 'textMuted'}
            style={selected && styles.faded}>
            {children}
        </ThemedText>
    );
}

/** Layout shared by the desktop list pages. */
export const listPage = StyleSheet.create({
    /** The row holding the list column and the panel. */
    page: {
        flex: 1,
        flexDirection: 'row',
    },
    /** Content of the scrolling list inside the column. */
    list: {
        paddingHorizontal: Spacing.three,
        paddingBottom: Spacing.four,
        gap: Spacing.two,
    },
    panel: {
        paddingVertical: 32,
        paddingHorizontal: 40,
        // 560 of content plus the padding.
        maxWidth: 640,
    },
});

const styles = StyleSheet.create({
    column: {
        borderRightWidth: 1,
    },
    header: {
        paddingTop: 32,
        paddingHorizontal: Spacing.four,
        paddingBottom: Spacing.three,
        gap: Spacing.three,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
    },
    grow: {
        flex: 1,
    },
    addButton: {
        paddingVertical: Spacing.three,
        borderRadius: 14,
        alignItems: 'center',
    },
    buttonText: {
        fontFamily: 'Karla_600SemiBold',
        fontSize: 18,
        lineHeight: 24,
    },
    pressed: {
        opacity: 0.6,
    },
    faded: {
        opacity: 0.8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.three,
        borderRadius: 14,
    },
});
