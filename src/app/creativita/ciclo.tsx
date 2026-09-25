import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedView } from '@/components/themed-view';
import { CycleForm } from '@/creativity/cycle-form';
import { useIsDesktop } from '@/hooks/use-is-desktop';

export default function CyclePage() {
    const router = useRouter();
    const isDesktop = useIsDesktop();
    const { id } = useLocalSearchParams<{ id?: string }>();

    // On desktop the form lives in the panel beside the list.
    if (isDesktop) {
        return (
            <Redirect
                href={{
                    pathname: '/creativita',
                    params: id ? { id, edit: '1' } : { new: '1' },
                }}
            />
        );
    }

    const leave = () =>
        router.canGoBack() ? router.back() : router.replace('/creativita');

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader
                    title={id ? 'Modifica ciclo' : 'Nuovo ciclo'}
                    backTo="/creativita"
                />
                <CycleForm id={id} onDone={leave} />
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
