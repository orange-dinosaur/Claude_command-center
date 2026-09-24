import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authClient, verificationCallbackURL } from '@/auth/client';
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

export default function LoginScreen() {
    const { reset } = useLocalSearchParams<{ reset?: string }>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [unverified, setUnverified] = useState(false);
    const [resent, setResent] = useState(false);
    const [pending, setPending] = useState(false);

    const canSubmit = email.trim().length > 0 && password.length > 0;

    const signIn = async () => {
        if (!canSubmit || pending) return;
        setPending(true);
        setError(null);
        setUnverified(false);
        setResent(false);

        const { error: signInError } = await authClient.signIn.email({
            email: email.trim(),
            password,
        });

        setPending(false);

        if (signInError) {
            setUnverified(signInError.code === 'EMAIL_NOT_VERIFIED');
            setError(errorMessage(signInError, 'Accesso non riuscito.'));
            return;
        }

        router.replace('/');
    };

    const resendVerification = async () => {
        if (pending) return;
        setPending(true);
        setError(null);

        const { error: resendError } = await authClient.sendVerificationEmail({
            email: email.trim(),
            callbackURL: verificationCallbackURL,
        });

        setPending(false);

        if (resendError) {
            setError(errorMessage(resendError, 'Invio non riuscito.'));
            return;
        }

        setResent(true);
    };

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <AuthTitle>Accedi</AuthTitle>

                    {reset && (
                        <ThemedText themeColor="textMuted">
                            Password aggiornata. Accedi con la nuova password.
                        </ThemedText>
                    )}

                    <View style={styles.form}>
                        <AuthField
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            autoComplete="email"
                            keyboardType="email-address"
                        />
                        <AuthField
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            autoCapitalize="none"
                            autoComplete="current-password"
                            secureTextEntry
                            onSubmitEditing={signIn}
                        />
                    </View>

                    <ErrorText>{error}</ErrorText>

                    {unverified && !resent && (
                        <Pressable
                            onPress={resendVerification}
                            accessibilityRole="button">
                            <ThemedText type="small" themeColor="accent">
                                Invia di nuovo l&apos;email di conferma
                            </ThemedText>
                        </Pressable>
                    )}

                    {resent && (
                        <ThemedText type="small" themeColor="textMuted">
                            Inviata. Controlla la posta, poi accedi.
                        </ThemedText>
                    )}

                    <SubmitButton
                        title="Accedi"
                        onPress={signIn}
                        disabled={!canSubmit}
                        pending={pending}
                    />

                    <Link href="/forgot-password" asChild>
                        <Pressable
                            accessibilityRole="button"
                            style={styles.forgot}>
                            <ThemedText type="small" themeColor="accent">
                                Password dimenticata?
                            </ThemedText>
                        </Pressable>
                    </Link>

                    <View style={styles.footer}>
                        <ThemedText type="small" themeColor="textMuted">
                            Non hai un account?
                        </ThemedText>
                        <Link href="/signup" asChild>
                            <Pressable accessibilityRole="button">
                                <ThemedText type="small" themeColor="accent">
                                    Registrati
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
    form: {
        gap: Spacing.three,
        paddingTop: Spacing.three,
    },
    forgot: {
        alignSelf: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.two,
        paddingTop: Spacing.three,
    },
});
