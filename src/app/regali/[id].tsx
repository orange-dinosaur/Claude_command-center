import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { RecipientDetail } from '@/gifts/recipient-detail';

export default function RegaliRecipient() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <RecipientDetail
                    id={id}
                    onRemoved={() =>
                        router.canGoBack()
                            ? router.back()
                            : router.replace('/regali')
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
