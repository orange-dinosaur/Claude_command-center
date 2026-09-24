import { useRouter } from 'expo-router';
import { useState } from 'react';
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
import { useHealth, type Medicine } from '@/hooks/use-health';
import { useTheme } from '@/hooks/use-theme';

const TABS = ['Visite', 'Farmaci'] as const;

type Tab = (typeof TABS)[number];

export default function Health() {
    const theme = useTheme();
    const router = useRouter();
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
                        <AddButton
                            onPress={() => router.push('/salute/visita')}
                        />
                        {health.checkups.length === 0 && (
                            <Empty>Ancora nessuna visita.</Empty>
                        )}
                        {health.checkups.map((c) => (
                            <Pressable
                                key={c.id}
                                onPress={() =>
                                    router.push({
                                        pathname: '/salute/visita',
                                        params: { id: c.id },
                                    })
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
                                <ThemedText style={styles.grow}>
                                    {c.name}
                                </ThemedText>
                                <ThemedText themeColor="textMuted">
                                    {c.lastDate
                                        ? formatDay(c.lastDate)
                                        : 'Nessuna data'}
                                </ThemedText>
                            </Pressable>
                        ))}
                    </ScrollView>
                ) : (
                    <ScrollView contentContainerStyle={styles.list}>
                        <AddButton
                            onPress={() => router.push('/salute/farmaco')}
                        />
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

function AddButton({ onPress }: { onPress: () => void }) {
    const theme = useTheme();

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            style={({ pressed }) => [
                styles.addButton,
                { backgroundColor: theme.accent },
                pressed && styles.pressed,
            ]}>
            <ThemedText style={[styles.buttonText, { color: theme.onAccent }]}>
                Aggiungi
            </ThemedText>
        </Pressable>
    );
}

function MedicineRow({ medicine }: { medicine: Medicine }) {
    const theme = useTheme();
    const router = useRouter();

    return (
        <Pressable
            onPress={() =>
                router.push({
                    pathname: '/salute/farmaco',
                    params: { id: medicine.id },
                })
            }
            accessibilityRole="button"
            style={({ pressed }) => [
                styles.row,
                { backgroundColor: theme.backgroundElement },
                pressed && styles.pressed,
            ]}>
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
        </Pressable>
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
    addButton: {
        paddingVertical: Spacing.three,
        borderRadius: 14,
        alignItems: 'center',
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
