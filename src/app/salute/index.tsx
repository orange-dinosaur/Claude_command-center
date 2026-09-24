import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { TabBar } from '@/components/tab-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { formatDay } from '@/dates';
import { useHealth, type Medicine } from '@/hooks/use-health';
import { useTheme } from '@/hooks/use-theme';

const TABS = ['Visite', 'Farmaci'] as const;

type Tab = (typeof TABS)[number];

export default function Health() {
    const theme = useTheme();
    const { health, error } = useHealth();
    const [tab, setTab] = useState<Tab>('Visite');

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader title="Salute" backTo="/command-center" />
                <TabBar tabs={TABS} value={tab} onChange={setTab} />

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
                ) : tab === 'Visite' ? (
                    <ScrollView contentContainerStyle={styles.list}>
                        {health.checkups.length === 0 && (
                            <Empty>Ancora nessuna visita.</Empty>
                        )}
                        {health.checkups.map((c) => (
                            <View
                                key={c.id}
                                style={[
                                    styles.row,
                                    {
                                        backgroundColor:
                                            theme.backgroundElement,
                                    },
                                ]}>
                                <ThemedText style={styles.grow}>
                                    {c.name}
                                </ThemedText>
                                <ThemedText themeColor="textMuted">
                                    {c.lastDate
                                        ? formatDay(c.lastDate)
                                        : 'Nessuna data'}
                                </ThemedText>
                            </View>
                        ))}
                    </ScrollView>
                ) : (
                    <ScrollView contentContainerStyle={styles.list}>
                        {health.ongoing.length === 0 &&
                            health.ended.length === 0 && (
                                <Empty>Ancora nessun farmaco.</Empty>
                            )}
                        {health.ongoing.map((m) => (
                            <MedicineRow key={m.id} medicine={m} />
                        ))}
                        {health.ended.length > 0 && (
                            <ThemedText type="subtitle" style={styles.section}>
                                Terminati
                            </ThemedText>
                        )}
                        {health.ended.map((m) => (
                            <MedicineRow key={m.id} medicine={m} />
                        ))}
                    </ScrollView>
                )}
            </SafeAreaView>
        </ThemedView>
    );
}

function MedicineRow({ medicine }: { medicine: Medicine }) {
    const theme = useTheme();

    return (
        <View
            style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.grow}>
                <ThemedText>{medicine.name}</ThemedText>
                {medicine.frequency && (
                    <ThemedText type="small" themeColor="textMuted">
                        {medicine.frequency}
                    </ThemedText>
                )}
            </View>
            <View style={styles.dates}>
                {medicine.startDate && (
                    <ThemedText type="small" themeColor="textMuted">
                        dal {formatDay(medicine.startDate)}
                    </ThemedText>
                )}
                {medicine.endDate && (
                    <ThemedText type="small" themeColor="textMuted">
                        al {formatDay(medicine.endDate)}
                    </ThemedText>
                )}
            </View>
        </View>
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
    message: {
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.three,
        textAlign: 'center',
    },
    list: {
        padding: Spacing.four,
        gap: Spacing.two,
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
    grow: {
        flex: 1,
    },
    dates: {
        alignItems: 'flex-end',
    },
});
