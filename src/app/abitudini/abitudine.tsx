import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedView } from '@/components/themed-view';
import { HabitForm } from '@/habits/habit-form';
import { useIsDesktop } from '@/hooks/use-is-desktop';

/** Adds a habit, or edits the one in `?id=`. */
export default function HabitPage() {
    const router = useRouter();
    const isDesktop = useIsDesktop();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const back = () =>
        router.canGoBack() ? router.back() : router.replace('/abitudini');

    // On desktop the form lives in the panel beside the week.
    if (isDesktop) {
        return (
            <Redirect
                href={{
                    pathname: '/abitudini',
                    params: id ? { id, modifica: '1' } : {},
                }}
            />
        );
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader
                    title={id ? 'Modifica abitudine' : 'Nuova abitudine'}
                    backTo="/abitudini"
                />
                <HabitForm
                    id={id}
                    onSaved={back}
                    // The habit's own page is gone too, so skip past it.
                    onDeleted={() => router.dismissTo('/abitudini')}
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
