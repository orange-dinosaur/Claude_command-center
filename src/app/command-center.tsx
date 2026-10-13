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
import { useTools } from '@/hooks/use-tools';

export default function CommandCenter() {
    // The auth guard sees the session end and replaces this screen with login.
    const signOut = () => authClient.signOut();
    const visible = useTools().tools.filter((tool) => !tool.hidden);

    // On desktop the rail holds the tools.
    if (useIsDesktop()) return <Redirect href="/" />;

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader
                    title="Command center"
                    backTo="/"
                    link={{
                        label: 'Impostazioni',
                        href: '/impostazioni',
                        icon: {
                            ios: 'gearshape',
                            android: 'settings',
                            web: 'settings',
                        },
                    }}
                />
                <View style={styles.grid}>
                    {visible.map((tool) => (
                        <ToolButton
                            key={tool.key}
                            title={tool.title}
                            href={tool.href}
                            icon={tool.icon}
                        />
                    ))}
                    {visible.length === 0 && (
                        <ThemedText themeColor="textMuted">
                            Nessuno strumento visibile. Li riaccendi dalle
                            impostazioni.
                        </ThemedText>
                    )}
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
