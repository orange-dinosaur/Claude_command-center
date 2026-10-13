import { Redirect, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedView } from '@/components/themed-view';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { LessonActivities } from '@/sport/lesson-activities';

/** The lesson activities, each with its balance. */
export default function PaymentsPage() {
    const router = useRouter();
    const isDesktop = useIsDesktop();

    // On desktop the list lives in the panel beside the workouts.
    if (isDesktop) {
        return (
            <Redirect
                href={{ pathname: '/sport', params: { pagamenti: '1' } }}
            />
        );
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader title="Pagamenti" backTo="/sport" />
                <LessonActivities
                    onOpen={(id) =>
                        router.push({
                            pathname: '/sport/pagamenti/[id]',
                            params: { id },
                        })
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
