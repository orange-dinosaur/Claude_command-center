import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { nextSeason, seasonKey, seasonLabel, seasonOf } from '@/bucket/season';
import { AddButton, ListRow, Secondary } from '@/components/list-column';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { todayDay } from '@/dates';
import { useBucketSeasons } from '@/hooks/use-bucket-seasons';
import { useTheme } from '@/hooks/use-theme';

export default function BucketList() {
    const theme = useTheme();
    const router = useRouter();
    const { seasons, busy, error, prepareNext, reload } = useBucketSeasons();

    const current = seasonOf(todayDay());
    const next = nextSeason(current);
    const hasNext = seasons?.some((s) => seasonKey(s) > seasonKey(current));

    const open = (id: string) => router.push(`/bucket-list/${id}`);

    const prepare = async () => {
        const id = await prepareNext();
        if (id) {
            reload();
            open(id);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader title="Bucket list" backTo="/command-center" />
                {seasons && !hasNext && (
                    <AddButton
                        label={`Prepara ${seasonLabel(next)}`}
                        onPress={prepare}
                        disabled={busy}
                        style={styles.newSpacing}
                    />
                )}

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
                    <ScrollView contentContainerStyle={styles.list}>
                        {seasons.map((s) => (
                            <ListRow key={s.id} onPress={() => open(s.id)}>
                                <ThemedText
                                    type="subtitle"
                                    style={styles.seasonName}>
                                    {seasonLabel(s)}
                                </ThemedText>
                                <Secondary selected={false}>
                                    {s.done}/{s.total}
                                </Secondary>
                            </ListRow>
                        ))}
                    </ScrollView>
                )}
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
