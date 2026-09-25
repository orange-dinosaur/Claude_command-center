import { Redirect } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedView } from '@/components/themed-view';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { WorkoutTypes } from '@/sport/workout-types';

/** Renames workout types, and deletes the ones no workout uses. */
export default function WorkoutTypesPage() {
    const isDesktop = useIsDesktop();

    // On desktop the types live in the panel beside the list.
    if (isDesktop) {
        return (
            <Redirect href={{ pathname: '/sport', params: { tipi: '1' } }} />
        );
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader title="Tipi" backTo="/sport" />
                <WorkoutTypes />
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
