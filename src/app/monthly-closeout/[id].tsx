import { useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { monthLabel } from '@/closeout/months';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedView } from '@/components/themed-view';
import { useCloseoutMonths } from '@/hooks/use-closeout-months';

export default function CloseoutMonth() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { months } = useCloseoutMonths();
    const month = months?.find((m) => m.id === id);

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader
                    title={month ? monthLabel(month.year, month.month) : ''}
                    backTo="/monthly-closeout"
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
