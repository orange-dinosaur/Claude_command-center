import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedView } from '@/components/themed-view';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { LessonActivityView } from '@/sport/lesson-activity';

/** One lesson activity, opened from Pagamenti. */
export default function LessonActivityPage() {
    const router = useRouter();
    const isDesktop = useIsDesktop();
    const { id } = useLocalSearchParams<{ id: string }>();

    // On desktop the activity lives in the panel beside the workouts.
    if (isDesktop) {
        return (
            <Redirect
                href={{ pathname: '/sport', params: { pagamenti: id } }}
            />
        );
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <LessonActivityView
                    id={id}
                    header={(title) => (
                        <ScreenHeader title={title} backTo="/sport/pagamenti" />
                    )}
                    onGone={() =>
                        router.canGoBack()
                            ? router.back()
                            : router.replace('/sport/pagamenti')
                    }
                />
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
