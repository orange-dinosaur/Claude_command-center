import { Redirect, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedView } from '@/components/themed-view';
import { WeekView } from '@/creativity/week-view';
import { useIsDesktop } from '@/hooks/use-is-desktop';

export default function WeekScreen() {
    const isDesktop = useIsDesktop();
    const params = useLocalSearchParams<{ cycle: string; week: string }>();

    // On desktop the week lives in the panel beside the list.
    if (isDesktop) {
        return (
            <Redirect
                href={{
                    pathname: '/creativita',
                    params: { id: params.cycle, week: params.week },
                }}
            />
        );
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader
                    title={`Settimana ${params.week}`}
                    backTo="/creativita"
                />
                <WeekView cycleId={params.cycle} number={Number(params.week)} />
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
