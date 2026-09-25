import { Stack } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';

import { MARK } from '@/components/auth-form';
import { DateBlock } from '@/components/date-block';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useIsDesktop } from '@/hooks/use-is-desktop';

export default function AuthLayout() {
    const isDesktop = useIsDesktop();
    const scheme = useColorScheme();

    return (
        <View style={styles.row}>
            {isDesktop && (
                <ThemedView type="backgroundElement" style={styles.panel}>
                    <Image source={MARK[scheme]} style={styles.mark} alt="" />
                    <DateBlock />
                    <ThemedText type="subtitle">Command center</ThemedText>
                </ThemedView>
            )}
            <View style={styles.form}>
                <Stack
                    screenOptions={{
                        headerShown: false,
                        contentStyle: isDesktop ? styles.column : undefined,
                    }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flex: 1,
        flexDirection: 'row',
    },
    panel: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 48,
    },
    mark: {
        width: 56,
        height: 56,
    },
    form: {
        flex: 2,
    },
    column: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
});
