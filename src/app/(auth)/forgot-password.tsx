import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authClient, resetPasswordURL } from '@/auth/client';
import { errorMessage } from '@/auth/messages';
import {
    AuthField,
    AuthTitle,
    ErrorText,
    SubmitButton,
} from '@/components/auth-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);
    const [pending, setPending] = useState(false);

    const canSubmit = email.trim().length > 0;

    const requestReset = async () => {
        if (!canSubmit || pending) return;
        setPending(true);
        setError(null);

        const { error: requestError } = await authClient.requestPasswordReset({
            email: email.trim(),
            redirectTo: resetPasswordURL,
        });

        setPending(false);

        if (requestError) {
            setError(errorMessage(requestError, 'Invio non riuscito.'));
            return;
        }

        setSent(true);
    };

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <AuthTitle>Password dimenticata</AuthTitle>

                    {sent ? (
                        // The server answers the same whether or not the
                        // account exists, so this does too.
                        <ThemedText themeColor="textMuted">
                            Se l&apos;indirizzo esiste ti abbiamo inviato un
                            link. Aprilo per scegliere una nuova password.
                        </ThemedText>
                    ) : (
                        <>
                            <ThemedText themeColor="textMuted">
                                Scrivi la tua email e ti mandiamo un link per
                                scegliere una nuova password.
                            </ThemedText>

                            <AuthField
                                label="Email"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                autoComplete="email"
                                keyboardType="email-address"
                                onSubmitEditing={requestReset}
                            />

                            <ErrorText>{error}</ErrorText>

                            <SubmitButton
                                title="Invia il link"
                                onPress={requestReset}
                                disabled={!canSubmit}
                                pending={pending}
                            />
                        </>
                    )}

                    <View style={styles.footer}>
                        <Link href="/login" asChild>
                            <Pressable accessibilityRole="button">
                                <ThemedText type="small" themeColor="accent">
                                    Torna ad Accedi
                                </ThemedText>
                            </Pressable>
                        </Link>
                    </View>
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
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingTop: Spacing.three,
    },
});
