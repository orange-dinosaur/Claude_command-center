import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MonthDetail } from '@/closeout/month-detail';
import { MONTH_NAMES, monthLabel, nextMonth } from '@/closeout/months';
import {
    AddButton,
    ListColumn,
    ListRow,
    Secondary,
    listPage,
} from '@/components/list-column';
import { ScreenHeader } from '@/components/screen-header';
import { Sheet } from '@/components/sheet';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCloseoutMonths } from '@/hooks/use-closeout-months';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useTheme } from '@/hooks/use-theme';

export default function MonthlyCloseout() {
    const theme = useTheme();
    const router = useRouter();
    const isDesktop = useIsDesktop();
    const params = useLocalSearchParams<{ id?: string }>();
    const { months, busy, error, create, reload } = useCloseoutMonths();
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

    // With no month in the URL, desktop shows the newest one.
    const selected = params.id ?? months?.[0]?.id;

    // On desktop a row selects the month for the panel beside the list; on
    // the phone it opens the month.
    const open = (id: string) =>
        isDesktop
            ? router.setParams({ id })
            : router.push(`/monthly-closeout/${id}`);

    const confirm = async () => {
        if (!picked) return;
        const id = await create(picked.year, picked.month);
        setPicked(null);
        if (id) {
            reload();
            open(id);
        }
    };

    const newButton = (
        <AddButton
            label="Nuovo mese"
            onPress={openPicker}
            disabled={months === undefined || busy}
            style={!isDesktop && styles.newSpacing}
        />
    );

    const list = (
        <>
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
                <ScrollView
                    contentContainerStyle={
                        isDesktop ? listPage.list : styles.list
                    }>
                    {months.map((m) => {
                        const isSelected = isDesktop && m.id === selected;
                        return (
                            <ListRow
                                key={m.id}
                                selected={isSelected}
                                onPress={() => open(m.id)}>
                                <ThemedText
                                    type="subtitle"
                                    themeColor={
                                        isSelected ? 'onAccent' : 'text'
                                    }
                                    style={styles.monthName}>
                                    {monthLabel(m.year, m.month)}
                                </ThemedText>
                                <Secondary selected={isSelected}>
                                    {m.done}/{m.total}
                                </Secondary>
                            </ListRow>
                        );
                    })}
                </ScrollView>
            )}
        </>
    );

    const sheet = (
        <Sheet visible={picked !== null} onClose={() => setPicked(null)}>
            {picked && <MonthPicker value={picked} onChange={setPicked} />}
            <Pressable
                onPress={confirm}
                disabled={busy}
                accessibilityRole="button"
                style={({ pressed }) => [
                    styles.sheetButton,
                    pressed && styles.pressed,
                ]}>
                <ThemedText themeColor="accent" style={styles.buttonText}>
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
                <ThemedText>Annulla</ThemedText>
            </Pressable>
        </Sheet>
    );

    if (isDesktop) {
        return (
            <ThemedView style={listPage.page}>
                <ListColumn
                    title="Monthly closeout"
                    width={280}
                    header={newButton}>
                    {list}
                </ListColumn>
                <View style={styles.grow}>
                    {/* The key starts afresh whenever the selection changes. */}
                    {selected && (
                        <MonthDetail
                            key={selected}
                            id={selected}
                            onDeleted={() => {
                                reload();
                                router.setParams({ id: undefined });
                            }}
                            onItemsChanged={reload}
                        />
                    )}
                </View>
                {sheet}
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader
                    title="Monthly closeout"
                    backTo="/command-center"
                />
                {newButton}
                {list}
                {sheet}
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
                                        color: theme.onAccent,
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
    newSpacing: {
        marginHorizontal: Spacing.four,
        marginBottom: Spacing.three,
    },
    buttonText: {
        fontFamily: 'Karla_600SemiBold',
        fontSize: 18,
        lineHeight: 24,
    },
    monthName: {
        flex: 1,
        fontSize: 24,
        lineHeight: 28,
    },
    grow: {
        flex: 1,
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
    pressed: {
        opacity: 0.6,
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
