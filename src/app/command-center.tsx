import { Redirect } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authClient } from '@/auth/client';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ToolButton } from '@/components/tool-button';
import { Spacing } from '@/constants/theme';
import { useIsDesktop } from '@/hooks/use-is-desktop';

export default function CommandCenter() {
    // The auth guard sees the session end and replaces this screen with login.
    const signOut = () => authClient.signOut();

    // On desktop the rail holds the tools.
    if (useIsDesktop()) return <Redirect href="/" />;

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
                    <ToolButton
                        title="Salute"
                        href="/salute"
                        icon={{
                            ios: 'heart.text.square',
                            android: 'monitor_heart',
                            web: 'monitor_heart',
                        }}
                    />
                    <ToolButton
                        title="Media"
                        href="/media"
                        icon={{
                            ios: 'books.vertical',
                            android: 'local_library',
                            web: 'local_library',
                        }}
                    />
                    <ToolButton
                        title="Creatività"
                        href="/creativita"
                        icon={{
                            ios: 'paintpalette',
                            android: 'palette',
                            web: 'palette',
                        }}
                    />
                    <ToolButton
                        title="Sport"
                        href="/sport"
                        icon={{
                            ios: 'figure.run',
                            android: 'directions_run',
                            web: 'directions_run',
                        }}
                    />
                    <ToolButton
                        title="Abitudini"
                        href="/abitudini"
                        icon={{
                            ios: 'checkmark.circle',
                            android: 'check_circle',
                            web: 'check_circle',
                        }}
                    />
                    <ToolButton
                        title="Bucket list"
                        href="/bucket-list"
                        icon={{
                            ios: 'sun.max',
                            android: 'wb_sunny',
                            web: 'wb_sunny',
                        }}
                    />
                    <ToolButton
                        title="Brain dump"
                        href="/brain-dump"
                        icon={{
                            ios: 'brain',
                            android: 'psychology',
                            web: 'psychology',
                        }}
                    />
                    <ToolButton
                        title="Glimmers"
                        href="/glimmers"
                        icon={{
                            ios: 'sparkles',
                            android: 'auto_awesome',
                            web: 'auto_awesome',
                        }}
                    />
                </View>
                <View style={styles.spacer} />
                <Pressable
                    onPress={signOut}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                        styles.signOut,
                        pressed && styles.pressed,
                    ]}>
                    <ThemedText themeColor="danger">Esci</ThemedText>
                </Pressable>
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
    spacer: {
        flex: 1,
    },
    signOut: {
        alignSelf: 'center',
        padding: Spacing.three,
        marginBottom: Spacing.three,
    },
    pressed: {
        opacity: 0.6,
    },
});
