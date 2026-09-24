import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authClient } from '@/auth/client';
import { errorMessage } from '@/auth/messages';
import { AuthField, ErrorText, SubmitButton } from '@/components/auth-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

/**
 * The email link checks the token on the server first, then lands here with
 * either `?token=…` or `?error=INVALID_TOKEN`.
 */
export default function ResetPasswordScreen() {
    const { token, error: linkError } = useLocalSearchParams<{
        token?: string;
        error?: string;
    }>();
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(
        linkError || !token ? errorMessage({ code: 'INVALID_TOKEN' }, '') : null
    );
    const [pending, setPending] = useState(false);

    const usable = Boolean(token) && !linkError;
    const canSubmit = usable && password.length >= 8;

    const resetPassword = async () => {
        if (!canSubmit || pending || !token) return;
        setPending(true);
        setError(null);

        const { error: resetError } = await authClient.resetPassword({
            newPassword: password,
            token,
        });

        setPending(false);

        if (resetError) {
            setError(errorMessage(resetError, 'Salvataggio non riuscito.'));
            return;
        }

        router.replace({ pathname: '/login', params: { reset: '1' } });
    };

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <ThemedText type="title">Nuova password</ThemedText>

                    {usable && (
                        <AuthField
                            label="Nuova password"
                            placeholder="Almeno 8 caratteri"
                            value={password}
                            onChangeText={setPassword}
                            autoCapitalize="none"
                            autoComplete="new-password"
                            secureTextEntry
                            onSubmitEditing={resetPassword}
                        />
                    )}

                    <ErrorText>{error}</ErrorText>

                    {usable ? (
                        <SubmitButton
                            title="Salva la password"
                            onPress={resetPassword}
                            disabled={!canSubmit}
                            pending={pending}
                        />
                    ) : (
                        <Link href="/forgot-password" asChild>
                            <Pressable
                                accessibilityRole="button"
                                style={styles.link}>
                                <ThemedText type="small" themeColor="accent">
                                    Chiedi un nuovo link
                                </ThemedText>
                            </Pressable>
                        </Link>
                    )}
                </View>
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.six,
        gap: Spacing.three,
    },
    link: {
        alignSelf: 'center',
    },
});
