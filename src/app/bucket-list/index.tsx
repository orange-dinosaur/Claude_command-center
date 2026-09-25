import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { nextSeason, seasonKey, seasonLabel, seasonOf } from '@/bucket/season';
import { SeasonDetail } from '@/bucket/season-detail';
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
import { todayDay } from '@/dates';
import { useBucketSeasons } from '@/hooks/use-bucket-seasons';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useTheme } from '@/hooks/use-theme';

export default function BucketList() {
    const theme = useTheme();
    const router = useRouter();
    const isDesktop = useIsDesktop();
    const params = useLocalSearchParams<{ id?: string }>();
    const { seasons, busy, error, prepareNext, reload } = useBucketSeasons();

    const current = seasonOf(todayDay());
    const next = nextSeason(current);
    const hasNext = seasons?.some((s) => seasonKey(s) > seasonKey(current));

    // With no season in the URL, desktop shows the current one.
    const selected =
        params.id ??
        seasons?.find((s) => seasonKey(s) === seasonKey(current))?.id;

    // On desktop a row selects the season for the panel beside the list; on
    // the phone it opens the season.
    const open = (id: string) =>
        isDesktop
            ? router.setParams({ id })
            : router.push(`/bucket-list/${id}`);

    const prepare = async () => {
        const id = await prepareNext();
        if (id) {
            reload();
            open(id);
        }
    };

    const prepareButton = seasons && !hasNext && (
        <AddButton
            label={`Prepara ${seasonLabel(next)}`}
            onPress={prepare}
            disabled={busy}
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

            {seasons === undefined ? (
                <ActivityIndicator
                    color={theme.textMuted}
                    style={styles.message}
                />
            ) : (
                <ScrollView
                    contentContainerStyle={
                        isDesktop ? listPage.list : styles.list
                    }>
                    {seasons.map((s) => {
                        const isSelected = isDesktop && s.id === selected;
                        return (
                            <ListRow
                                key={s.id}
                                selected={isSelected}
                                onPress={() => open(s.id)}>
                                <ThemedText
                                    type="subtitle"
                                    themeColor={
                                        isSelected ? 'onAccent' : 'text'
                                    }
                                    style={styles.seasonName}>
                                    {seasonLabel(s)}
                                </ThemedText>
                                <Secondary selected={isSelected}>
                                    {s.done}/{s.total}
                                </Secondary>
                            </ListRow>
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
                    title="Bucket list"
                    width={280}
                    header={prepareButton}>
                    {list}
                </ListColumn>
                <View style={styles.container}>
                    {/* The key starts afresh whenever the selection changes. */}
                    {selected && (
                        <SeasonDetail
                            key={selected}
                            id={selected}
                            onItemsChanged={reload}
                            panel
                        />
                    )}
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader title="Bucket list" backTo="/command-center" />
                {prepareButton}
                {list}
            </SafeAreaView>
        </ThemedView>
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
    seasonName: {
        flex: 1,
        fontSize: 24,
        lineHeight: 28,
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
});
