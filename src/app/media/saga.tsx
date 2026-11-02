import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedView } from '@/components/themed-view';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { SAGA_HEADERS, SagaForm } from '@/media/saga-form';

/** Adds a saga, or edits the one in `?id=`. */
export default function SagaPage() {
    const router = useRouter();
    const isDesktop = useIsDesktop();
    const { id } = useLocalSearchParams<{ id?: string }>();

    // On desktop the form lives in the panel beside the list.
    if (isDesktop) {
        return <Redirect href="/media" />;
    }

    const backToList = () =>
        router.canGoBack() ? router.back() : router.replace('/media');

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader
                    title={id ? SAGA_HEADERS.edit : SAGA_HEADERS.add}
                    backTo="/media"
                />
                <SagaForm id={id} onSaved={backToList} onDeleted={backToList} />
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
