import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedView } from '@/components/themed-view';
import { MedicineForm } from '@/health/medicine-form';
import { useIsDesktop } from '@/hooks/use-is-desktop';

/** Adds a medicine, or edits the one in `?id=`. */
export default function MedicinePage() {
    const router = useRouter();
    const isDesktop = useIsDesktop();
    const { id } = useLocalSearchParams<{ id?: string }>();

    // On desktop the form lives in the panel beside the list.
    if (isDesktop) {
        return (
            <Redirect
                href={{
                    pathname: '/salute',
                    params: id ? { farmaco: id } : { tab: 'farmaci' },
                }}
            />
        );
    }

    const backToList = () =>
        router.canGoBack() ? router.back() : router.replace('/salute');

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader
                    title={id ? 'Farmaco' : 'Nuovo farmaco'}
                    backTo="/salute"
                />
                <MedicineForm
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
