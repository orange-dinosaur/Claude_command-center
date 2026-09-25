import { Redirect, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SeasonDetail } from '@/bucket/season-detail';
import { ThemedView } from '@/components/themed-view';
import { useIsDesktop } from '@/hooks/use-is-desktop';

export default function BucketSeason() {
    const isDesktop = useIsDesktop();
    const { id } = useLocalSearchParams<{ id: string }>();

    // On desktop the season lives in the panel beside the list.
    if (isDesktop) {
        return <Redirect href={{ pathname: '/bucket-list', params: { id } }} />;
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <SeasonDetail id={id} />
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
