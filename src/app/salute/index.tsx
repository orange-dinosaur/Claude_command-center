import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    AddButton,
    ListColumn,
    ListRow,
    Secondary,
    listPage,
} from '@/components/list-column';
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
    const { health, error, reload, drop } = useHealth();

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

            {health === undefined ? (
                <ActivityIndicator
                    color={theme.textMuted}
                    style={styles.message}
                />
            ) : (
                <ScrollView
                    contentContainerStyle={
                        isDesktop ? listPage.list : styles.list
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
                                    <ListRow
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
                                    </ListRow>
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
            <ThemedView style={listPage.page}>
                <ListColumn
                    title="Salute"
                    header={
                        <>
                            {tabBar}
                            {add}
                        </>
                    }>
                    {list}
                </ListColumn>
                <View style={styles.grow}>
                    {/* The key starts a fresh form whenever the selection changes. */}
                    {tab === 'Visite' ? (
                        <CheckupForm
                            key={params.visita ?? 'new'}
                            id={params.visita}
                            title={params.visita ? 'Visita' : 'Nuova visita'}
                            onSaved={(id) => saved('visita', id)}
                            onDeleted={() => {
                                if (params.visita) drop(params.visita);
                                saved('visita');
                            }}
                            style={listPage.panel}
                        />
                    ) : (
                        <MedicineForm
                            key={params.farmaco ?? 'new'}
                            id={params.farmaco}
                            title={params.farmaco ? 'Farmaco' : 'Nuovo farmaco'}
                            onSaved={(id) => saved('farmaco', id)}
                            onDeleted={() => {
                                if (params.farmaco) drop(params.farmaco);
                                saved('farmaco');
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
                <ScreenHeader title="Salute" backTo="/command-center" />
                {tabBar}
                {list}
            </SafeAreaView>
        </ThemedView>
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
        <ListRow selected={selected} onPress={onPress}>
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
        </ListRow>
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
    addSpacing: {
        marginBottom: Spacing.two,
    },
    section: {
        marginTop: Spacing.three,
    },
    grow: {
        flex: 1,
    },
    dates: {
        alignItems: 'flex-end',
    },
});
