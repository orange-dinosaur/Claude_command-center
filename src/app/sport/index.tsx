import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    AddButton,
    ListColumn,
    ListRow,
    Secondary,
    listPage,
} from '@/components/list-column';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { formatShortDay, todayDay } from '@/dates';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useTheme } from '@/hooks/use-theme';
import { useWorkouts, type Workout } from '@/hooks/use-sport';
import { LessonActivities } from '@/sport/lesson-activities';
import { LessonActivityView } from '@/sport/lesson-activity';
import { countWorkouts, formatMonth, groupByMonth } from '@/sport/riepilogo';
import { WorkoutForm } from '@/sport/workout-form';
import { WorkoutTypes } from '@/sport/workout-types';

export default function Sport() {
    const theme = useTheme();
    const router = useRouter();
    const isDesktop = useIsDesktop();
    const params = useLocalSearchParams<{
        id?: string;
        tipi?: string;
        data?: string;
        /** `1` for the list, otherwise the id of an open activity. */
        pagamenti?: string;
    }>();
    const { workouts, error, reload, drop, put } = useWorkouts();
    const today = todayDay();
    // Open months, keyed `YYYY-MM`; the current one starts open.
    const [open, setOpen] = useState<Record<string, boolean>>(() => ({
        [today.slice(0, 7)]: true,
    }));

    // The month holding the selected workout opens, and stays open after the
    // workout is deleted, unless it was closed by hand.
    const holding = workouts?.find((w) => w.id === params.id)?.date.slice(0, 7);
    if (holding && open[holding] === undefined) {
        setOpen((o) => ({ ...o, [holding]: true }));
    }

    const toggle = (month: string) =>
        setOpen((o) => ({ ...o, [month]: !o[month] }));

    // On desktop a row selects the workout for the panel beside the list; on
    // the phone it opens the form. Without an id it records a new workout.
    const select = (id?: string) => {
        if (isDesktop) {
            router.setParams({
                id,
                tipi: undefined,
                data: undefined,
                pagamenti: undefined,
            });
        } else {
            router.push({
                pathname: '/sport/allenamento',
                params: id ? { id } : undefined,
            });
        }
    };

    // Desktop only: `1` shows the activities in the panel, an id one activity,
    // nothing goes back to the workout form.
    const openPayments = (pagamenti?: string) =>
        router.setParams({ pagamenti, tipi: undefined, id: undefined });

    // After a save the workout stays selected; after a delete the panel
    // returns to the empty form.
    const saved = (id?: string) => {
        reload();
        select(id);
    };

    const counts = countWorkouts(workouts ?? [], today);

    const tiles = (
        <View style={styles.tiles}>
            <Tile value={counts.week} label="Settimana" />
            <Tile value={counts.month} label="Mese" />
        </View>
    );

    const add = (
        <AddButton
            label="Registra allenamento"
            onPress={() => select()}
            style={!isDesktop && styles.addSpacing}
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

            {workouts === undefined ? (
                <ActivityIndicator
                    color={theme.textMuted}
                    style={styles.message}
                />
            ) : (
                <ScrollView
                    contentContainerStyle={
                        isDesktop ? listPage.list : styles.list
                    }>
                    {!isDesktop && (
                        <>
                            {tiles}
                            {add}
                        </>
                    )}

                    {groupByMonth(workouts, today).map((group, i) => {
                        const isOpen = !!open[group.month];
                        return (
                            <View key={group.month} style={styles.group}>
                                <Pressable
                                    onPress={() => toggle(group.month)}
                                    accessibilityRole="button"
                                    accessibilityState={{ expanded: isOpen }}
                                    style={({ pressed }) => [
                                        styles.monthHeader,
                                        isDesktop && i === 0 && styles.flush,
                                        pressed && styles.pressed,
                                    ]}>
                                    <ThemedText
                                        type="subtitle"
                                        style={styles.grow}>
                                        {formatMonth(group.month)}
                                    </ThemedText>
                                    <SymbolView
                                        name={
                                            isOpen
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
                                </Pressable>
                                {isOpen &&
                                    (group.workouts.length === 0 ? (
                                        <ThemedText
                                            themeColor="textMuted"
                                            style={styles.message}>
                                            Nessun allenamento
                                        </ThemedText>
                                    ) : (
                                        group.workouts.map((w) => (
                                            <WorkoutRow
                                                key={w.id}
                                                workout={w}
                                                selected={w.id === params.id}
                                                onPress={() => select(w.id)}
                                            />
                                        ))
                                    ))}
                            </View>
                        );
                    })}
                </ScrollView>
            )}
        </>
    );

    if (isDesktop) {
        return (
            <ThemedView style={listPage.page}>
                <ListColumn
                    title="Sport"
                    link={[
                        {
                            label: 'Tipi',
                            onPress: () =>
                                router.setParams({
                                    tipi: '1',
                                    id: undefined,
                                    pagamenti: undefined,
                                }),
                        },
                        {
                            label: 'Pagamenti',
                            onPress: () => openPayments('1'),
                        },
                    ]}
                    header={
                        <>
                            {tiles}
                            {add}
                        </>
                    }>
                    {list}
                </ListColumn>
                <View style={styles.grow}>
                    {params.pagamenti === '1' ? (
                        <LessonActivities
                            header={
                                <PanelBack
                                    title="Pagamenti"
                                    label="Torna all’allenamento"
                                    onPress={() => openPayments(undefined)}
                                />
                            }
                            onOpen={openPayments}
                            style={listPage.panel}
                        />
                    ) : params.pagamenti ? (
                        <LessonActivityView
                            key={params.pagamenti}
                            id={params.pagamenti}
                            header={(title) => (
                                <View style={[listPage.panel, styles.panelTop]}>
                                    <PanelBack
                                        title={title}
                                        label="Torna a Pagamenti"
                                        onPress={() => openPayments('1')}
                                    />
                                </View>
                            )}
                            onGone={() => openPayments('1')}
                            style={[listPage.panel, styles.panelBelow]}
                        />
                    ) : params.tipi ? (
                        <WorkoutTypes
                            header={
                                <PanelBack
                                    title="Tipi"
                                    label="Torna all’allenamento"
                                    onPress={() =>
                                        router.setParams({ tipi: undefined })
                                    }
                                />
                            }
                            onChanged={reload}
                            style={listPage.panel}
                        />
                    ) : (
                        // The key starts a fresh form whenever the selection changes.
                        <WorkoutForm
                            key={params.id ?? `new-${params.data}`}
                            id={params.id}
                            initialDate={params.data}
                            title={
                                params.id ? 'Allenamento' : 'Nuovo allenamento'
                            }
                            onSaved={(workout) => {
                                put(workout);
                                saved(workout.id);
                            }}
                            onDeleted={() => {
                                if (params.id) drop(params.id);
                                saved();
                            }}
                            style={listPage.panel}
                        />
                    )}
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader
                    title="Sport"
                    backTo="/command-center"
                    link={[
                        { label: 'Tipi', href: '/sport/tipi' },
                        { label: 'Pagamenti', href: '/sport/pagamenti' },
                    ]}
                />
                {list}
            </SafeAreaView>
        </ThemedView>
    );
}

/** A panel title with a back arrow, on desktop. */
function PanelBack({
    title,
    label,
    onPress,
}: {
    title: string;
    label: string;
    onPress: () => void;
}) {
    const theme = useTheme();

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <SymbolView
                name={{
                    ios: 'chevron.left',
                    android: 'chevron_left',
                    web: 'chevron_left',
                }}
                tintColor={theme.text}
                size={28}
            />
            <ThemedText type="title">{title}</ThemedText>
        </Pressable>
    );
}

function Tile({ value, label }: { value: number; label: string }) {
    const theme = useTheme();

    return (
        <View
            style={[styles.tile, { backgroundColor: theme.backgroundElement }]}>
            {/* Karla: Cormorant's old-style 1 reads as an I. */}
            <ThemedText style={styles.count}>{value}</ThemedText>
            <ThemedText type="small" themeColor="textMuted">
                {label}
            </ThemedText>
        </View>
    );
}

function WorkoutRow({
    workout,
    selected,
    onPress,
}: {
    workout: Workout;
    selected: boolean;
    onPress: () => void;
}) {
    return (
        <ListRow selected={selected} onPress={onPress}>
            <View style={styles.grow}>
                <ThemedText themeColor={selected ? 'onAccent' : 'text'}>
                    {workout.typeName}
                </ThemedText>
                {workout.note && (
                    <ThemedText
                        type="small"
                        themeColor={selected ? 'onAccent' : 'textMuted'}
                        style={selected && styles.faded}
                        numberOfLines={1}>
                        {workout.note}
                    </ThemedText>
                )}
            </View>
            <View style={styles.dates}>
                <Secondary selected={selected} small>
                    {formatShortDay(workout.date)}
                </Secondary>
                {workout.minutes !== null && (
                    <Secondary selected={selected} small>
                        {workout.minutes} min
                    </Secondary>
                )}
            </View>
        </ListRow>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    message: {
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.three,
        textAlign: 'center',
    },
    list: {
        padding: Spacing.four,
        gap: Spacing.two,
    },
    tiles: {
        flexDirection: 'row',
        gap: Spacing.two,
    },
    tile: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing.three,
        borderRadius: 14,
    },
    count: {
        fontFamily: 'Karla_600SemiBold',
        fontSize: 32,
        lineHeight: 40,
    },
    addSpacing: {
        marginVertical: Spacing.two,
    },
    pressed: {
        opacity: 0.6,
    },
    faded: {
        opacity: 0.8,
    },
    group: {
        gap: Spacing.two,
    },
    monthHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Spacing.three,
    },
    flush: {
        paddingTop: 0,
    },
    back: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
        marginBottom: Spacing.three,
    },
    // The activity's title sits above its scrolling content.
    panelTop: {
        paddingBottom: Spacing.three,
    },
    panelBelow: {
        paddingTop: 0,
    },
    grow: {
        flex: 1,
    },
    dates: {
        alignItems: 'flex-end',
    },
});
