import { useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SeasonDetail } from '@/bucket/season-detail';
import { ThemedView } from '@/components/themed-view';

export default function BucketSeason() {
    const { id } = useLocalSearchParams<{ id: string }>();

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <SeasonDetail id={id} />
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
