import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedView } from '@/components/themed-view';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { WorkoutForm } from '@/sport/workout-form';

/**
 * Records a workout, on the day in `?data=` if there is one, or edits the one
 * in `?id=`.
 */
export default function WorkoutPage() {
    const router = useRouter();
    const isDesktop = useIsDesktop();
    const { id, data } = useLocalSearchParams<{ id?: string; data?: string }>();

    // On desktop the form lives in the panel beside the list.
    if (isDesktop) {
        return (
            <Redirect
                href={{
                    pathname: '/sport',
                    params: id ? { id } : data ? { data } : {},
                }}
            />
        );
    }

    const backToList = () =>
        router.canGoBack() ? router.back() : router.replace('/sport');

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader
                    title={id ? 'Allenamento' : 'Nuovo allenamento'}
                    backTo="/sport"
                />
                <WorkoutForm
                    id={id}
                    initialDate={data}
                    onSaved={backToList}
                    onDeleted={backToList}
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
