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

import { AddButton, ListColumn, listPage } from '@/components/list-column';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { addDays, formatDayRange, todayDay } from '@/dates';
import { HabitDetail } from '@/habits/habit-detail';
import { HabitForm } from '@/habits/habit-form';
import { mondayOf } from '@/habits/stats';
import { useDayPress } from '@/habits/use-day-press';
import { WeekRow } from '@/habits/week-row';
import { useHabits, type Habit } from '@/hooks/use-habits';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useTheme } from '@/hooks/use-theme';

export default function Abitudini() {
    const theme = useTheme();
    const router = useRouter();
    const isDesktop = useIsDesktop();
    const params = useLocalSearchParams<{ id?: string; modifica?: string }>();
    const today = todayDay();
    const { habits, error, reload, mark, unmark } = useHabits();
    const { press, sheet } = useDayPress({ mark, unmark });
    const thisMonday = mondayOf(today);
    const [monday, setMonday] = useState(thisMonday);

    const active = habits?.filter((h) => !h.archivedAt);
    const archived = habits?.filter((h) => h.archivedAt) ?? [];
    const selected = habits?.find((h) => h.id === params.id);

    // On desktop a habit opens in the panel beside the week; on the phone it
    // opens its own page. Without a habit the panel shows the new habit form.
    const open = (habit?: Habit, edit = false) => {
        if (isDesktop) {
            router.setParams({
                id: habit?.id,
                modifica: edit ? '1' : undefined,
            });
        } else if (habit) {
            router.push({
                pathname: '/abitudini/[id]',
                params: { id: habit.id },
            });
        } else {
            router.push('/abitudini/abitudine');
        }
    };

    const arrow = (
        symbol: string,
        label: string,
        to: string,
        disabled = false
    ) => (
        <Pressable
            onPress={() => setMonday(to)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={label}
            hitSlop={Spacing.two}
            style={({ pressed }) => [
                styles.arrow,
                disabled && styles.disabled,
                pressed && styles.pressed,
            ]}>
            <ThemedText type="subtitle">{symbol}</ThemedText>
        </Pressable>
    );

    const week = (
        <View style={styles.week}>
            {arrow('‹', 'Settimana prima', addDays(monday, -7))}
            <ThemedText style={styles.range}>
                {formatDayRange(monday, addDays(monday, 6))}
            </ThemedText>
            {arrow(
                '›',
                'Settimana dopo',
                addDays(monday, 7),
                monday >= thisMonday
            )}
        </View>
    );

    const add = <AddButton label="Nuova abitudine" onPress={() => open()} />;

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
            {active === undefined ? (
                <ActivityIndicator
                    color={theme.textMuted}
                    style={styles.message}
                />
            ) : (
                <ScrollView
                    contentContainerStyle={
                        isDesktop ? listPage.list : styles.list
                    }>
                    {!isDesktop && week}
                    {active.map((habit) => (
                        <WeekRow
                            key={habit.id}
                            habit={habit}
                            monday={monday}
                            today={today}
                            selected={habit.id === selected?.id}
                            onPressDay={(day) => press(habit, day)}
                            onPressName={() => open(habit)}
                        />
                    ))}
                    {active.length === 1 && (
                        <ThemedText
                            themeColor="textMuted"
                            style={styles.message}>
                            Aggiungi le abitudini che vuoi seguire. Sport si
                            segna da sola con i tuoi allenamenti.
                        </ThemedText>
                    )}
                    {!isDesktop && add}
                    {archived.length > 0 && (
                        <View style={styles.archived}>
                            <ThemedText type="subtitle">Archiviate</ThemedText>
                            {archived.map((habit) => (
                                <Pressable
                                    key={habit.id}
                                    onPress={() => open(habit)}
                                    accessibilityRole="link"
                                    style={({ pressed }) => [
                                        styles.archivedRow,
                                        { borderTopColor: theme.border },
                                        pressed && styles.pressed,
                                    ]}>
                                    <ThemedText
                                        themeColor={
                                            habit.id === selected?.id
                                                ? 'accent'
                                                : 'text'
                                        }>
                                        {habit.name}
                                    </ThemedText>
                                </Pressable>
                            ))}
                        </View>
                    )}
                </ScrollView>
            )}
        </>
    );

    if (isDesktop) {
        // After a save the habit stays selected; after a delete the panel
        // returns to the new habit form.
        const saved = (id?: string) => {
            reload();
            router.setParams({ id, modifica: undefined });
        };

        return (
            <ThemedView style={listPage.page}>
                <ListColumn
                    title="Abitudini"
                    width={400}
                    header={
                        <>
                            {week}
                            {add}
                        </>
                    }>
                    {list}
                </ListColumn>
                <View style={styles.grow}>
                    {!selected ? (
                        habits !== undefined && (
                            <HabitForm
                                key="new"
                                title="Nuova abitudine"
                                onSaved={saved}
                                onDeleted={saved}
                                style={listPage.panel}
                            />
                        )
                    ) : params.modifica ? (
                        <HabitForm
                            key={`edit-${selected.id}`}
                            id={selected.id}
                            title="Modifica abitudine"
                            onSaved={saved}
                            onDeleted={() => saved()}
                            onMoved={reload}
                            style={listPage.panel}
                        />
                    ) : (
                        <HabitDetail
                            key={selected.id}
                            habit={selected}
                            today={today}
                            onPressDay={(day) => press(selected, day)}
                            style={listPage.panel}
                            header={
                                <View style={styles.titleRow}>
                                    <ThemedText
                                        type="title"
                                        style={styles.grow}>
                                        {selected.name}
                                    </ThemedText>
                                    <Pressable
                                        onPress={() => open(selected, true)}
                                        accessibilityRole="link"
                                        hitSlop={Spacing.two}
                                        style={({ pressed }) =>
                                            pressed && styles.pressed
                                        }>
                                        <ThemedText themeColor="accent">
                                            Modifica
                                        </ThemedText>
                                    </Pressable>
                                </View>
                            }
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
                <ScreenHeader title="Abitudini" backTo="/command-center" />
                {list}
            </SafeAreaView>
            {sheet}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        padding: Spacing.four,
        gap: Spacing.three,
    },
    week: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    range: {
        flex: 1,
        textAlign: 'center',
    },
    arrow: {
        paddingHorizontal: Spacing.three,
    },
    archived: {
        marginTop: Spacing.four,
        gap: Spacing.two,
    },
    archivedRow: {
        paddingVertical: Spacing.three,
        borderTopWidth: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.four,
    },
    disabled: {
        opacity: 0.3,
    },
    pressed: {
        opacity: 0.6,
    },
});
