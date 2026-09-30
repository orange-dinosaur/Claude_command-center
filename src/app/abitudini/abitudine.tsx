import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedView } from '@/components/themed-view';
import { HabitForm } from '@/habits/habit-form';

/** Adds a habit. */
export default function HabitPage() {
    const router = useRouter();
    const backToWeek = () =>
        router.canGoBack() ? router.back() : router.replace('/abitudini');

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader title="Nuova abitudine" backTo="/abitudini" />
                <HabitForm onSaved={backToWeek} />
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
