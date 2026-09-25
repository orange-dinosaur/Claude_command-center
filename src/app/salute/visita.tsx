import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedView } from '@/components/themed-view';
import { CheckupForm } from '@/health/checkup-form';
import { useIsDesktop } from '@/hooks/use-is-desktop';

/** Adds a check-up, or edits the one in `?id=`. */
export default function CheckupPage() {
    const router = useRouter();
    const isDesktop = useIsDesktop();
    const { id } = useLocalSearchParams<{ id?: string }>();

    // On desktop the form lives in the panel beside the list.
    if (isDesktop) {
        return (
            <Redirect
                href={{ pathname: '/salute', params: id ? { visita: id } : {} }}
            />
        );
    }

    const backToList = () =>
        router.canGoBack() ? router.back() : router.replace('/salute');

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader
                    title={id ? 'Visita' : 'Nuova visita'}
                    backTo="/salute"
                />
                <CheckupForm
                    id={id}
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
