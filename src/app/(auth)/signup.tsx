import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { authClient, verificationCallbackURL } from '@/auth/client';
import { errorMessage } from '@/auth/messages';
import {
    AuthField,
    AuthScreen,
    AuthTitle,
    ErrorText,
    SubmitButton,
} from '@/components/auth-form';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export default function SignupScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [registered, setRegistered] = useState(false);
    const [resent, setResent] = useState(false);
    const [pending, setPending] = useState(false);

    const canSubmit =
        name.trim().length > 0 &&
        email.trim().length > 0 &&
        password.length >= 8;

    const signUp = async () => {
        if (!canSubmit || pending) return;
        setPending(true);
        setError(null);

        const { error: signUpError } = await authClient.signUp.email({
            name: name.trim(),
            email: email.trim(),
            password,
            callbackURL: verificationCallbackURL,
        });

        setPending(false);

        if (signUpError) {
            setError(errorMessage(signUpError, 'Registrazione non riuscita.'));
            return;
        }

        setRegistered(true);
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

    const loginLink = (prompt: string) => (
        <View style={styles.footer}>
            <ThemedText type="small" themeColor="textMuted">
                {prompt}
            </ThemedText>
            <Link href="/login" asChild>
                <Pressable accessibilityRole="button">
                    <ThemedText type="small" themeColor="accent">
                        Accedi
                    </ThemedText>
                </Pressable>
            </Link>
        </View>
    );

    return (
        <AuthScreen>
            {registered ? (
                <>
                    <AuthTitle>Controlla la tua email</AuthTitle>
                    {/* Sign-up succeeds even if the mail failed, so offer to resend. */}
                    <ThemedText themeColor="textMuted">
                        Ti abbiamo mandato un link a {email.trim()}. Aprilo per
                        confermare l&apos;account, poi accedi.
                    </ThemedText>

                    <ErrorText>{error}</ErrorText>

                    {resent ? (
                        <ThemedText type="small" themeColor="textMuted">
                            Inviata di nuovo. Controlla la posta.
                        </ThemedText>
                    ) : (
                        <SubmitButton
                            title="Invia di nuovo"
                            onPress={resendVerification}
                            pending={pending}
                        />
                    )}

                    {loginLink('Hai già confermato?')}
                </>
            ) : (
                <>
                    <AuthTitle>Registrati</AuthTitle>

                    <View style={styles.form}>
                        <AuthField
                            label="Nome"
                            value={name}
                            onChangeText={setName}
                            autoComplete="name"
                        />
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
                            placeholder="Almeno 8 caratteri"
                            value={password}
                            onChangeText={setPassword}
                            autoCapitalize="none"
                            autoComplete="new-password"
                            secureTextEntry
                            onSubmitEditing={signUp}
                        />
                    </View>

                    <ErrorText>{error}</ErrorText>

                    <SubmitButton
                        title="Registrati"
                        onPress={signUp}
                        disabled={!canSubmit}
                        pending={pending}
                    />

                    {loginLink('Hai già un account?')}
                </>
            )}
        </AuthScreen>
    );
}

const styles = StyleSheet.create({
    form: {
        gap: Spacing.three,
        paddingTop: Spacing.three,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.two,
        paddingTop: Spacing.three,
    },
});
