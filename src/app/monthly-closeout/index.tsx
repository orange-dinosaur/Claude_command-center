import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MONTH_NAMES, monthLabel, nextMonth } from '@/closeout/months';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCloseoutMonths } from '@/hooks/use-closeout-months';
import { useTheme } from '@/hooks/use-theme';

export default function MonthlyCloseout() {
    const theme = useTheme();
    const router = useRouter();
    const { months, busy, error, create } = useCloseoutMonths();
    const [picked, setPicked] = useState<{
        year: number;
        month: number;
    } | null>(null);

    const openPicker = () => {
        const newest = months?.[0];
        if (newest) {
            setPicked(nextMonth(newest.year, newest.month));
        } else {
            const today = new Date();
            setPicked({
                year: today.getFullYear(),
                month: today.getMonth() + 1,
            });
        }
    };

    const confirm = async () => {
        if (!picked) return;
        const id = await create(picked.year, picked.month);
        setPicked(null);
        if (id) router.push(`/monthly-closeout/${id}`);
    };

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader
                    title="Monthly closeout"
                    backTo="/command-center"
                />

                <Pressable
                    onPress={openPicker}
                    disabled={months === undefined || busy}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                        styles.newButton,
                        { backgroundColor: theme.accent },
                        pressed && styles.pressed,
                    ]}>
                    <ThemedText
                        type="subtitle"
                        style={{ color: theme.backgroundElement }}>
                        Nuovo mese
                    </ThemedText>
                </Pressable>

                {error && (
                    <ThemedText
                        type="small"
                        themeColor="danger"
                        style={styles.message}>
                        {error}
                    </ThemedText>
                )}

                {months === undefined ? (
                    <ActivityIndicator
                        color={theme.textMuted}
                        style={styles.message}
                    />
                ) : months.length === 0 ? (
                    <ThemedText themeColor="textMuted" style={styles.message}>
                        Ancora nessun mese. Crea il primo con “Nuovo mese”.
                    </ThemedText>
                ) : (
                    <ScrollView contentContainerStyle={styles.list}>
                        {months.map((m) => (
                            <Pressable
                                key={m.id}
                                onPress={() =>
                                    router.push(`/monthly-closeout/${m.id}`)
                                }
                                accessibilityRole="button"
                                style={({ pressed }) => [
                                    styles.row,
                                    {
                                        backgroundColor:
                                            theme.backgroundElement,
                                    },
                                    pressed && styles.pressed,
                                ]}>
                                <ThemedText type="subtitle">
                                    {monthLabel(m.year, m.month)}
                                </ThemedText>
                                <ThemedText themeColor="textMuted">
                                    {m.done}/{m.total}
                                </ThemedText>
                            </Pressable>
                        ))}
                    </ScrollView>
                )}

                <Modal
                    visible={picked !== null}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setPicked(null)}>
                    <Pressable
                        style={styles.backdrop}
                        onPress={() => setPicked(null)}>
                        {/* Taps inside the sheet must not close it. */}
                        <Pressable
                            style={[
                                styles.sheet,
                                { backgroundColor: theme.backgroundElement },
                            ]}>
                            {picked && (
                                <MonthPicker
                                    value={picked}
                                    onChange={setPicked}
                                />
                            )}
                            <Pressable
                                onPress={confirm}
                                disabled={busy}
                                accessibilityRole="button"
                                style={({ pressed }) => [
                                    styles.sheetButton,
                                    pressed && styles.pressed,
                                ]}>
                                <ThemedText themeColor="accent" type="subtitle">
                                    {picked
                                        ? `Crea ${monthLabel(picked.year, picked.month)}`
                                        : ''}
                                </ThemedText>
                            </Pressable>
                            <Pressable
                                onPress={() => setPicked(null)}
                                accessibilityRole="button"
                                style={({ pressed }) => [
                                    styles.sheetButton,
                                    pressed && styles.pressed,
                                ]}>
                                <ThemedText themeColor="accent">
                                    Annulla
                                </ThemedText>
                            </Pressable>
                        </Pressable>
                    </Pressable>
                </Modal>
            </SafeAreaView>
        </ThemedView>
    );
}

function MonthPicker({
    value,
    onChange,
}: {
    value: { year: number; month: number };
    onChange: (value: { year: number; month: number }) => void;
}) {
    const theme = useTheme();

    return (
        <View style={styles.picker}>
            <View style={styles.yearRow}>
                <Pressable
                    onPress={() => onChange({ ...value, year: value.year - 1 })}
                    disabled={value.year <= 2000}
                    accessibilityLabel="Anno precedente"
                    hitSlop={Spacing.two}>
                    <ThemedText type="subtitle" themeColor="accent">
                        ‹
                    </ThemedText>
                </Pressable>
                <ThemedText type="subtitle">{value.year}</ThemedText>
                <Pressable
                    onPress={() => onChange({ ...value, year: value.year + 1 })}
                    disabled={value.year >= 2100}
                    accessibilityLabel="Anno successivo"
                    hitSlop={Spacing.two}>
                    <ThemedText type="subtitle" themeColor="accent">
                        ›
                    </ThemedText>
                </Pressable>
            </View>
            <View style={styles.monthGrid}>
                {MONTH_NAMES.map((name, i) => {
                    const selected = value.month === i + 1;
                    return (
                        <Pressable
                            key={name}
                            onPress={() => onChange({ ...value, month: i + 1 })}
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                            style={[
                                styles.monthCell,
                                selected && {
                                    backgroundColor: theme.accent,
                                },
                            ]}>
                            <ThemedText
                                type="small"
                                style={
                                    selected && {
                                        color: theme.backgroundElement,
                                    }
                                }>
                                {name.slice(0, 3)}
                            </ThemedText>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    newButton: {
        marginHorizontal: Spacing.four,
        marginBottom: Spacing.three,
        paddingVertical: Spacing.three,
        borderRadius: 14,
        alignItems: 'center',
    },
    message: {
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.three,
        textAlign: 'center',
    },
    list: {
        paddingHorizontal: Spacing.four,
        paddingBottom: Spacing.four,
        gap: Spacing.two,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.three,
        borderRadius: 14,
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
        paddingVertical: Spacing.two,
    },
    sheetButton: {
        alignItems: 'center',
        paddingVertical: Spacing.three,
    },
    picker: {
        padding: Spacing.three,
        gap: Spacing.three,
    },
    yearRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.five,
    },
    monthGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        rowGap: Spacing.two,
    },
    monthCell: {
        width: '25%',
        alignItems: 'center',
        paddingVertical: Spacing.two,
        borderRadius: 10,
    },
});
