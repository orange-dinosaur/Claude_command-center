import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedView } from '@/components/themed-view';
import { ToolButton } from '@/components/tool-button';
import { Spacing } from '@/constants/theme';

export default function CommandCenter() {
    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader title="Command center" backTo="/" />
                <View style={styles.grid}>
                    <ToolButton
                        title="Monthly closeout"
                        href="/monthly-closeout"
                        icon={{
                            ios: 'calendar',
                            android: 'calendar_month',
                            web: 'calendar_month',
                        }}
                    />
                </View>
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.three,
        paddingHorizontal: Spacing.four,
    },
});
