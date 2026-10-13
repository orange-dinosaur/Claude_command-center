import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { ToolList } from '@/settings/tool-list';

export default function Settings() {
    const isDesktop = useIsDesktop();

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={isDesktop && styles.desktop}>
                    <ScreenHeader
                        title="Impostazioni"
                        backTo={isDesktop ? undefined : '/command-center'}
                    />
                    <ThemedView style={styles.body}>
                        <ToolList />
                    </ThemedView>
                </ScrollView>
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    desktop: {
        maxWidth: 640,
    },
    body: {
        paddingHorizontal: Spacing.four,
        paddingBottom: Spacing.four,
    },
});
