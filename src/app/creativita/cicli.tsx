import { Redirect, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedView } from '@/components/themed-view';
import { PastCycles } from '@/creativity/past-cycles';
import { useIsDesktop } from '@/hooks/use-is-desktop';

export default function PastCyclesPage() {
    const router = useRouter();
    const isDesktop = useIsDesktop();

    // On desktop the list lives in the panel beside the cycle.
    if (isDesktop) {
        return (
            <Redirect
                href={{ pathname: '/creativita', params: { past: '1' } }}
            />
        );
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader title="Cicli passati" backTo="/creativita" />
                <PastCycles
                    onOpen={(id) =>
                        router.push({ pathname: '/creativita', params: { id } })
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
