import { useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

import { MONTH_NAMES, monthLabel, nextMonth } from '@/closeout/months';
import { PREPARE, RECAP } from '@/closeout/questions';
import { CloseoutChecklist } from '@/components/closeout-checklist';
import { CloseoutQuestions } from '@/components/closeout-questions';
import { ScreenHeader } from '@/components/screen-header';
import { Sheet } from '@/components/sheet';
import { TabBar } from '@/components/tab-bar';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import {
    useCloseoutMonth,
    type ChecklistItem,
} from '@/hooks/use-closeout-month';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useTheme } from '@/hooks/use-theme';

const TABS = ['Recap', 'Prepare', 'Closeout'] as const;

type Tab = (typeof TABS)[number];

/**
 * One month's answers and checklist. On the phone it is a whole screen with
 * "Elimina mese" at the bottom; on desktop it fills the panel beside the list,
 * with "Elimina mese" next to the title.
 */
export function MonthDetail({
    id,
    onDeleted,
    onItemsChanged,
}: {
    id: string;
    onDeleted: () => void;
    /** Called after a checklist change, which moves the list's counts. */
    onItemsChanged?: () => void;
}) {
    const theme = useTheme();
    const isDesktop = useIsDesktop();
    const {
        month,
        busy,
        error,
        remove,
        saveAnswer,
        itemError,
        toggleItem,
        removeItem,
        addItem,
    } = useCloseoutMonth(id);
    const [tab, setTab] = useState<Tab>('Recap');
    const [confirming, setConfirming] = useState(false);

    const label = month ? monthLabel(month.year, month.month) : '';

    const confirmDelete = async () => {
        setConfirming(false);
        if (await remove()) onDeleted();
    };

    const toggle = async (item: ChecklistItem) => {
        await toggleItem(item);
        onItemsChanged?.();
    };
    const drop = async (item: ChecklistItem) => {
        await removeItem(item);
        onItemsChanged?.();
    };
    const add = async (area: string, text: string) => {
        const added = await addItem(area, text);
        onItemsChanged?.();
        return added;
    };

    const preparing = month && nextMonth(month.year, month.month);

    const deleteButton = (
        <Pressable
            onPress={() => setConfirming(true)}
            disabled={busy}
            accessibilityRole="button"
            style={({ pressed }) => [
                !isDesktop && styles.deleteButton,
                pressed && styles.pressed,
            ]}>
            <ThemedText themeColor="danger">Elimina mese</ThemedText>
        </Pressable>
    );

    const body =
        month === undefined ? (
            <ActivityIndicator color={theme.textMuted} style={styles.message} />
        ) : month === null ? (
            <ThemedText themeColor="textMuted" style={styles.message}>
                {error ?? 'Questo mese non esiste più.'}
            </ThemedText>
        ) : (
            <>
                {isDesktop && (
                    <View style={styles.titleRow}>
                        <ThemedText type="title" style={styles.grow}>
                            {label}
                        </ThemedText>
                        {deleteButton}
                    </View>
                )}
                <TabBar
                    tabs={TABS}
                    value={tab}
                    onChange={setTab}
                    style={isDesktop && styles.desktopTabs}
                />
                <ScrollView
                    contentContainerStyle={
                        isDesktop ? styles.desktopBody : styles.body
                    }
                    keyboardShouldPersistTaps="handled">
                    {tab === 'Prepare' && preparing && (
                        <ThemedText themeColor="textMuted">
                            Per {MONTH_NAMES[preparing.month - 1].toLowerCase()}{' '}
                            {preparing.year}
                        </ThemedText>
                    )}

                    {tab !== 'Closeout' && (
                        <CloseoutQuestions
                            key={tab}
                            sections={tab === 'Recap' ? RECAP : PREPARE}
                            answers={month.answers}
                            onSave={saveAnswer}
                        />
                    )}

                    {tab === 'Closeout' && (
                        <CloseoutChecklist
                            items={month.items}
                            error={itemError}
                            onToggle={toggle}
                            onRemove={drop}
                            onAdd={add}
                        />
                    )}

                    {(!isDesktop || error) && <View style={styles.spacer} />}

                    {error && (
                        <ThemedText
                            type="small"
                            themeColor="danger"
                            style={styles.center}>
                            {error}
                        </ThemedText>
                    )}
                    {!isDesktop && deleteButton}
                </ScrollView>
            </>
        );

    return (
        <>
            {isDesktop ? (
                <View style={styles.panel}>{body}</View>
            ) : (
                <>
                    <ScreenHeader title={label} backTo="/monthly-closeout" />
                    {body}
                </>
            )}

            <Sheet visible={confirming} onClose={() => setConfirming(false)}>
                <ThemedText type="subtitle" style={styles.sheetTitle}>
                    Eliminare {label}?
                </ThemedText>
                <ThemedText themeColor="textMuted" style={styles.center}>
                    Risposte e checklist andranno perse.
                </ThemedText>
                <Pressable
                    onPress={confirmDelete}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                        styles.sheetButton,
                        pressed && styles.pressed,
                    ]}>
                    <ThemedText themeColor="danger">Elimina</ThemedText>
                </Pressable>
                <Pressable
                    onPress={() => setConfirming(false)}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                        styles.sheetButton,
                        {
                            borderTopWidth: 1,
                            borderTopColor: theme.border,
                        },
                        pressed && styles.pressed,
                    ]}>
                    <ThemedText>Annulla</ThemedText>
                </Pressable>
            </Sheet>
        </>
    );
}

const styles = StyleSheet.create({
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
    panel: {
        flex: 1,
        paddingTop: 32,
        paddingHorizontal: 40,
        gap: Spacing.four,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.four,
        maxWidth: 720,
    },
    grow: {
        flex: 1,
    },
    desktopTabs: {
        marginHorizontal: 0,
        width: 420,
    },
    desktopBody: {
        paddingBottom: 32,
        gap: Spacing.three,
        maxWidth: 720,
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
