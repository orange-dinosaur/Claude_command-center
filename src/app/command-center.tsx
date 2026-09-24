import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authClient } from '@/auth/client';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ToolButton } from '@/components/tool-button';
import { Spacing } from '@/constants/theme';

export default function CommandCenter() {
    // The auth guard sees the session end and replaces this screen with login.
    const signOut = () => authClient.signOut();

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
