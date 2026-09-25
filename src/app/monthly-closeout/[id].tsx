import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MonthDetail } from '@/closeout/month-detail';
import { ThemedView } from '@/components/themed-view';
import { useIsDesktop } from '@/hooks/use-is-desktop';

export default function CloseoutMonth() {
    const router = useRouter();
    const isDesktop = useIsDesktop();
    const { id } = useLocalSearchParams<{ id: string }>();

    // On desktop the month lives in the panel beside the list.
    if (isDesktop) {
        return (
            <Redirect
                href={{ pathname: '/monthly-closeout', params: { id } }}
            />
        );
    }

    const backToList = () =>
        router.canGoBack()
            ? router.back()
            : router.replace('/monthly-closeout');

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <MonthDetail id={id} onDeleted={backToList} />
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
