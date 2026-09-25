import { useLocalSearchParams, useRouter } from 'expo-router';
import { type ReactNode } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { TabBar } from '@/components/tab-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { formatDay } from '@/dates';
import { CheckupForm } from '@/health/checkup-form';
import { MedicineForm } from '@/health/medicine-form';
import { useHealth, type Medicine } from '@/hooks/use-health';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useTheme } from '@/hooks/use-theme';

const TABS = ['Visite', 'Farmaci'] as const;

type Tab = (typeof TABS)[number];

type Kind = 'visita' | 'farmaco';

export default function Health() {
    const theme = useTheme();
    const router = useRouter();
    const isDesktop = useIsDesktop();
    const params = useLocalSearchParams<{
        tab?: string;
        visita?: string;
        farmaco?: string;
    }>();
    const { health, error, reload } = useHealth();

    const tab: Tab =
        params.farmaco || params.tab === 'farmaci' ? 'Farmaci' : 'Visite';

    const setTab = (next: Tab) =>
        router.setParams({
            tab: next === 'Farmaci' ? 'farmaci' : undefined,
            visita: undefined,
            farmaco: undefined,
        });

    // On desktop a row selects the record for the panel beside the list; on
    // the phone it opens the form. Without an id it starts a new record.
    const open = (kind: Kind, id?: string) => {
        if (isDesktop) {
            router.setParams({
                tab: kind === 'farmaco' ? 'farmaci' : undefined,
                visita: kind === 'visita' ? id : undefined,
                farmaco: kind === 'farmaco' ? id : undefined,
            });
        } else {
            router.push({
                pathname:
                    kind === 'visita' ? '/salute/visita' : '/salute/farmaco',
                params: id ? { id } : undefined,
            });
        }
    };

    // After a save the record stays selected; after a delete the panel
    // returns to the empty form.
    const saved = (kind: Kind, id?: string) => {
        reload();
        open(kind, id);
    };

    const tabBar = (
        <TabBar
            tabs={TABS}
            value={tab}
            onChange={setTab}
            style={isDesktop && styles.flush}
        />
    );

    const add = (
        <AddButton
            onPress={() => open(tab === 'Visite' ? 'visita' : 'farmaco')}
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

            {health === undefined ? (
                <ActivityIndicator
                    color={theme.textMuted}
                    style={styles.message}
                />
            ) : (
                <ScrollView
                    contentContainerStyle={
                        isDesktop ? styles.desktopList : styles.list
                    }>
                    {!isDesktop && add}
                    {tab === 'Visite' ? (
                        <>
                            {health.checkups.length === 0 && (
                                <Empty>Ancora nessuna visita.</Empty>
                            )}
                            {health.checkups.map((c) => {
                                const selected = c.id === params.visita;
                                return (
                                    <Row
                                        key={c.id}
                                        selected={selected}
                                        onPress={() => open('visita', c.id)}>
                                        <ThemedText
                                            themeColor={
                                                selected ? 'onAccent' : 'text'
                                            }
                                            style={styles.grow}>
                                            {c.name}
                                        </ThemedText>
                                        <Secondary selected={selected}>
                                            {c.lastDate
                                                ? formatDay(c.lastDate)
                                                : 'Nessuna data'}
                                        </Secondary>
                                    </Row>
                                );
                            })}
                        </>
                    ) : (
                        <>
                            {health.ongoing.length === 0 &&
                                health.ended.length === 0 && (
                                    <Empty>Ancora nessun farmaco.</Empty>
                                )}
                            {health.ongoing.map((m) => (
                                <MedicineRow
                                    key={m.id}
                                    medicine={m}
                                    selected={m.id === params.farmaco}
                                    onPress={() => open('farmaco', m.id)}
                                />
                            ))}
                            {health.ended.length > 0 && (
                                <ThemedText
                                    type="subtitle"
                                    style={styles.section}>
                                    Terminati
                                </ThemedText>
                            )}
                            {health.ended.map((m) => (
                                <MedicineRow
                                    key={m.id}
                                    medicine={m}
                                    selected={m.id === params.farmaco}
                                    onPress={() => open('farmaco', m.id)}
                                />
                            ))}
                        </>
                    )}
                </ScrollView>
            )}
        </>
    );

    if (isDesktop) {
        return (
            <ThemedView style={styles.desktop}>
                <View
                    style={[styles.column, { borderRightColor: theme.border }]}>
                    <View style={styles.header}>
                        <ThemedText type="title">Salute</ThemedText>
                        {tabBar}
                        {add}
                    </View>
                    {list}
                </View>
                <View style={styles.grow}>
                    {/* The key starts a fresh form whenever the selection changes. */}
                    {tab === 'Visite' ? (
                        <CheckupForm
                            key={params.visita ?? 'new'}
                            id={params.visita}
                            title={params.visita ? 'Visita' : 'Nuova visita'}
                            onSaved={(id) => saved('visita', id)}
                            onDeleted={() => saved('visita')}
                            style={styles.panel}
                        />
                    ) : (
                        <MedicineForm
                            key={params.farmaco ?? 'new'}
                            id={params.farmaco}
                            title={params.farmaco ? 'Farmaco' : 'Nuovo farmaco'}
                            onSaved={(id) => saved('farmaco', id)}
                            onDeleted={() => saved('farmaco')}
                            style={styles.panel}
                        />
                    )}
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader title="Salute" backTo="/command-center" />
                {tabBar}
                {list}
            </SafeAreaView>
        </ThemedView>
    );
}

function AddButton({ onPress }: { onPress: () => void }) {
    const theme = useTheme();
    const isDesktop = useIsDesktop();

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            style={({ pressed }) => [
                styles.addButton,
                !isDesktop && styles.addSpacing,
                { backgroundColor: theme.accent },
                pressed && styles.pressed,
            ]}>
            <ThemedText style={[styles.buttonText, { color: theme.onAccent }]}>
                Aggiungi
            </ThemedText>
        </Pressable>
    );
}

function Row({
    selected,
    onPress,
    children,
}: {
    selected: boolean;
    onPress: () => void;
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
                pressed && styles.pressed,
            ]}>
            {children}
        </Pressable>
    );
}

/** Muted text, or slightly faded `onAccent` on a selected row. */
function Secondary({
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

function MedicineRow({
    medicine,
    selected,
    onPress,
}: {
    medicine: Medicine;
    selected: boolean;
    onPress: () => void;
}) {
    return (
        <Row selected={selected} onPress={onPress}>
            <View style={styles.grow}>
                <ThemedText themeColor={selected ? 'onAccent' : 'text'}>
                    {medicine.name}
                </ThemedText>
                {medicine.frequency && (
                    <Secondary selected={selected} small>
                        {medicine.frequency}
                    </Secondary>
                )}
            </View>
            <View style={styles.dates}>
                {medicine.startDate && (
                    <Secondary selected={selected} small>
                        dal {formatDay(medicine.startDate)}
                    </Secondary>
                )}
                {medicine.endDate && (
                    <Secondary selected={selected} small>
                        al {formatDay(medicine.endDate)}
                    </Secondary>
                )}
            </View>
        </Row>
    );
}

function Empty({ children }: { children: string }) {
    return (
        <ThemedText themeColor="textMuted" style={styles.message}>
            {children}
        </ThemedText>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    desktop: {
        flex: 1,
        flexDirection: 'row',
    },
    column: {
        width: 360,
        borderRightWidth: 1,
    },
    header: {
        paddingTop: 32,
        paddingHorizontal: Spacing.four,
        paddingBottom: Spacing.three,
        gap: Spacing.three,
    },
    flush: {
        marginHorizontal: 0,
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
    desktopList: {
        paddingHorizontal: Spacing.three,
        paddingBottom: Spacing.four,
        gap: Spacing.two,
    },
    addButton: {
        paddingVertical: Spacing.three,
        borderRadius: 14,
        alignItems: 'center',
    },
    addSpacing: {
        marginBottom: Spacing.two,
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
    section: {
        marginTop: Spacing.three,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.three,
        borderRadius: 14,
    },
    panel: {
        paddingVertical: 32,
        paddingHorizontal: 40,
        // 560 of content plus the padding.
        maxWidth: 640,
    },
    grow: {
        flex: 1,
    },
    dates: {
        alignItems: 'flex-end',
    },
});
