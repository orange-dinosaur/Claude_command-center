import { Redirect, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedView } from '@/components/themed-view';
import { ClosingReview } from '@/creativity/closing-review';
import { useIsDesktop } from '@/hooks/use-is-desktop';

export default function ClosingReviewPage() {
    const isDesktop = useIsDesktop();
    const params = useLocalSearchParams<{ cycle: string }>();

    // On desktop the review lives in the panel beside the list.
    if (isDesktop) {
        return (
            <Redirect
                href={{
                    pathname: '/creativita',
                    params: { id: params.cycle, review: '1' },
                }}
            />
        );
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader title="Closing review" backTo="/creativita" />
                <ClosingReview cycleId={params.cycle} />
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
