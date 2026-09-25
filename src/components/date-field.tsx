/**
 * A date field that opens our own calendar sheet. The value is a
 * `YYYY-MM-DD` day or `null` for no date.
 */

import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { MONTH_NAMES, nextMonth } from '@/closeout/months';
import { Spacing } from '@/constants/theme';
import { formatDay, toDay, todayDay } from '@/dates';
import { useTheme } from '@/hooks/use-theme';

const WEEKDAYS = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

interface Shown {
    year: number;
    month: number;
}

export function DateField({
    value,
    onChange,
    label,
    mondaysOnly,
}: {
    value: string | null;
    onChange: (value: string | null) => void;
    label: string;
    /** Only Mondays can be picked, and the date cannot be cleared. */
    mondaysOnly?: boolean;
}) {
    const theme = useTheme();
    const [view, setView] = useState<Shown | null>(null);
    const [pickingYear, setPickingYear] = useState(false);

    const open = () => {
        const [year, month] = (value ?? todayDay()).split('-').map(Number);
        setView({ year, month });
        setPickingYear(false);
    };

    const pick = (day: string | null) => {
        onChange(day);
        setView(null);
    };

    return (
        <>
            <Pressable
                onPress={open}
                accessibilityRole="button"
                accessibilityLabel={label}
                style={({ pressed }) => [
                    styles.field,
                    { backgroundColor: theme.backgroundElement },
                    pressed && styles.pressed,
                ]}>
                <ThemedText themeColor={value ? 'text' : 'textMuted'}>
                    {value ? formatDay(value) : 'Nessuna data'}
                </ThemedText>
            </Pressable>

            <Modal
                visible={view !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setView(null)}>
                <Pressable
                    style={styles.backdrop}
                    onPress={() => setView(null)}>
                    {/* Taps inside the sheet must not close it. */}
                    <Pressable
                        style={[
                            styles.sheet,
                            { backgroundColor: theme.backgroundElement },
                        ]}>
                        {view && (
                            <Calendar
                                view={view}
                                onView={setView}
                                value={value}
                                pickingYear={pickingYear}
                                onPickingYear={setPickingYear}
                                onPick={pick}
                                mondaysOnly={mondaysOnly}
                            />
                        )}
                        {!mondaysOnly && (
                            <>
                                <SheetButton
                                    onPress={() => pick(todayDay())}
                                    accent>
                                    Oggi
                                </SheetButton>
                                <SheetButton onPress={() => pick(null)} accent>
                                    Nessuna data
                                </SheetButton>
                            </>
                        )}
                        <SheetButton onPress={() => setView(null)}>
                            Annulla
                        </SheetButton>
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
}

function Calendar({
    view,
    onView,
    value,
    pickingYear,
    onPickingYear,
    onPick,
    mondaysOnly,
}: {
    view: Shown;
    onView: (view: Shown) => void;
    value: string | null;
    pickingYear: boolean;
    onPickingYear: (picking: boolean) => void;
    onPick: (day: string) => void;
    mondaysOnly?: boolean;
}) {
    const theme = useTheme();
    const { year, month } = view;
    const today = todayDay();

    const previous = () =>
        onView(
            month === 1
                ? { year: year - 1, month: 12 }
                : { year, month: month - 1 }
        );

    const title = (
        <Pressable
            onPress={() => onPickingYear(!pickingYear)}
            accessibilityRole="button"
            accessibilityLabel="Scegli l'anno"
            hitSlop={Spacing.two}>
            <ThemedText type="subtitle">
                {MONTH_NAMES[month - 1]}{' '}
                <ThemedText type="subtitle" themeColor="accent">
                    {year}
                </ThemedText>
            </ThemedText>
        </Pressable>
    );

    if (pickingYear) {
        const current = new Date().getFullYear();
        const years = Array.from({ length: 36 }, (_, i) => current + 5 - i);
        return (
            <View style={styles.calendar}>
                <View style={styles.header}>{title}</View>
                <ScrollView style={styles.years}>
                    <View style={styles.grid}>
                        {years.map((y) => {
                            const selected = y === year;
                            return (
                                <Pressable
                                    key={y}
                                    onPress={() => {
                                        onView({ year: y, month });
                                        onPickingYear(false);
                                    }}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected }}
                                    style={[
                                        styles.yearCell,
                                        selected && {
                                            backgroundColor: theme.accent,
                                        },
                                    ]}>
                                    <ThemedText
                                        style={
                                            selected && {
                                                color: theme.onAccent,
                                            }
                                        }>
                                        {y}
                                    </ThemedText>
                                </Pressable>
                            );
                        })}
                    </View>
                </ScrollView>
            </View>
        );
    }

    // Monday first. getUTCDay() counts from Sunday.
    const blanks = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
    const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const days = Array.from({ length: count }, (_, i) =>
        toDay(year, month, i + 1)
    );

    return (
        <View style={styles.calendar}>
            <View style={[styles.header, styles.spread]}>
                <Pressable
                    onPress={previous}
                    accessibilityLabel="Mese precedente"
                    hitSlop={Spacing.two}>
                    <ThemedText type="subtitle" themeColor="accent">
                        ‹
                    </ThemedText>
                </Pressable>
                {title}
                <Pressable
                    onPress={() => onView(nextMonth(year, month))}
                    accessibilityLabel="Mese successivo"
                    hitSlop={Spacing.two}>
                    <ThemedText type="subtitle" themeColor="accent">
                        ›
                    </ThemedText>
                </Pressable>
            </View>
            <View style={styles.grid}>
                {WEEKDAYS.map((name, i) => (
                    <View key={i} style={styles.dayCell}>
                        <ThemedText type="small" themeColor="textMuted">
                            {name}
                        </ThemedText>
                    </View>
                ))}
                {Array.from({ length: blanks }, (_, i) => (
                    <View key={`blank-${i}`} style={styles.dayCell} />
                ))}
                {days.map((day, i) => {
                    const selected = day === value;
                    const disabled = mondaysOnly && (blanks + i) % 7 !== 0;
                    return (
                        <Pressable
                            key={day}
                            onPress={() => onPick(day)}
                            disabled={disabled}
                            accessibilityRole="button"
                            accessibilityLabel={formatDay(day)}
                            accessibilityState={{ selected, disabled }}
                            style={[
                                styles.dayCell,
                                styles.day,
                                selected && { backgroundColor: theme.accent },
                                disabled && styles.disabled,
                            ]}>
                            <ThemedText
                                themeColor={
                                    day === today && !selected
                                        ? 'accent'
                                        : 'text'
                                }
                                style={selected && { color: theme.onAccent }}>
                                {i + 1}
                            </ThemedText>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

function SheetButton({
    onPress,
    accent,
    children,
}: {
    onPress: () => void;
    accent?: boolean;
    children: string;
}) {
    const theme = useTheme();

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            style={({ pressed }) => [
                styles.sheetButton,
                { borderTopWidth: 1, borderTopColor: theme.border },
                pressed && styles.pressed,
            ]}>
            <ThemedText themeColor={accent ? 'accent' : 'text'}>
                {children}
            </ThemedText>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    field: {
        borderRadius: 12,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
    },
    pressed: {
        opacity: 0.6,
    },
    backdrop: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        padding: Spacing.three,
    },
    sheet: {
        borderRadius: 20,
        paddingTop: Spacing.two,
    },
    sheetButton: {
        alignItems: 'center',
        paddingVertical: Spacing.three,
    },
    calendar: {
        padding: Spacing.three,
        gap: Spacing.three,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    spread: {
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.two,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%',
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    day: {
        borderRadius: 20,
    },
    disabled: {
        opacity: 0.3,
    },
    years: {
        maxHeight: 280,
    },
    yearCell: {
        width: '25%',
        alignItems: 'center',
        paddingVertical: Spacing.two,
        borderRadius: 10,
    },
});
