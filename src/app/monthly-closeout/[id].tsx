import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { TabBar } from '@/components/tab-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCloseoutMonth } from '@/hooks/use-closeout-month';
import { useTheme } from '@/hooks/use-theme';

const TABS = ['Recap', 'Prepare', 'Closeout'] as const;

type Tab = (typeof TABS)[number];

export default function CloseoutMonth() {
    const theme = useTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { month, busy, error, remove } = useCloseoutMonth(id);
    const [tab, setTab] = useState<Tab>('Recap');
    const [confirming, setConfirming] = useState(false);

    const label = month ? monthLabel(month.year, month.month) : '';

    const backToList = () =>
        router.canGoBack()
            ? router.back()
            : router.replace('/monthly-closeout');

    const confirmDelete = async () => {
        setConfirming(false);
        if (await remove()) backToList();
    };

    const preparing = month && nextMonth(month.year, month.month);

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader title={label} backTo="/monthly-closeout" />

                {month === undefined ? (
                    <ActivityIndicator
                        color={theme.textMuted}
                        style={styles.message}
                    />
                ) : month === null ? (
                    <ThemedText themeColor="textMuted" style={styles.message}>
                        {error ?? 'Questo mese non esiste più.'}
                    </ThemedText>
                ) : (
                    <>
                        <TabBar tabs={TABS} value={tab} onChange={setTab} />
                        <ScrollView contentContainerStyle={styles.body}>
                            {tab === 'Prepare' && preparing && (
                                <ThemedText themeColor="textMuted">
                                    Per{' '}
                                    {MONTH_NAMES[
                                        preparing.month - 1
                                    ].toLowerCase()}{' '}
                                    {preparing.year}
                                </ThemedText>
                            )}

                            <View style={styles.spacer} />

                            {error && (
                                <ThemedText
                                    type="small"
                                    themeColor="danger"
                                    style={styles.center}>
                                    {error}
                                </ThemedText>
                            )}
                            <Pressable
                                onPress={() => setConfirming(true)}
                                disabled={busy}
                                accessibilityRole="button"
                                style={({ pressed }) => [
                                    styles.deleteButton,
                                    pressed && styles.pressed,
                                ]}>
                                <ThemedText themeColor="danger">
                                    Elimina mese
                                </ThemedText>
                            </Pressable>
                        </ScrollView>
                    </>
                )}

                <Modal
                    visible={confirming}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setConfirming(false)}>
                    <Pressable
                        style={styles.backdrop}
                        onPress={() => setConfirming(false)}>
                        <View
                            style={[
                                styles.sheet,
                                { backgroundColor: theme.backgroundElement },
                            ]}>
                            <ThemedText
                                type="subtitle"
                                style={styles.sheetTitle}>
                                Eliminare {label}?
                            </ThemedText>
                            <ThemedText
                                themeColor="textMuted"
                                style={styles.center}>
                                Risposte e checklist andranno perse.
                            </ThemedText>
                            <Pressable
                                onPress={confirmDelete}
                                accessibilityRole="button"
                                style={({ pressed }) => [
                                    styles.sheetButton,
                                    pressed && styles.pressed,
                                ]}>
                                <ThemedText themeColor="danger">
                                    Elimina
                                </ThemedText>
                            </Pressable>
                            <Pressable
                                onPress={() => setConfirming(false)}
                                accessibilityRole="button"
                                style={({ pressed }) => [
                                    styles.sheetButton,
                                    pressed && styles.pressed,
                                ]}>
                                <ThemedText themeColor="accent">
                                    Annulla
                                </ThemedText>
                            </Pressable>
                        </View>
                    </Pressable>
                </Modal>
            </SafeAreaView>
        </ThemedView>
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
    body: {
        flexGrow: 1,
        padding: Spacing.four,
        gap: Spacing.three,
    },
    spacer: {
        flex: 1,
        minHeight: Spacing.six,
    },
    center: {
        textAlign: 'center',
    },
    deleteButton: {
        alignSelf: 'center',
        padding: Spacing.three,
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
    sheetTitle: {
        textAlign: 'center',
        paddingTop: Spacing.three,
        paddingBottom: Spacing.one,
    },
    sheetButton: {
        alignItems: 'center',
        paddingVertical: Spacing.three,
    },
});
