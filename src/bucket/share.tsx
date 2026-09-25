/**
 * Sharing the bucket list: the sheet behind "Condividi", whose content follows
 * the state (invite someone, invite pending, shared), and the box that shows
 * each incoming invite with Accetta and Rifiuta.
 */

import { useState } from 'react';
import {
    Pressable,
    type StyleProp,
    StyleSheet,
    TextInput,
    View,
    type ViewStyle,
} from 'react-native';

import { Sheet } from '@/components/sheet';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { useBucketSharing } from '@/hooks/use-bucket-sharing';
import { useFocusRing } from '@/hooks/use-focus-ring';
import { useTheme } from '@/hooks/use-theme';

type SharingState = ReturnType<typeof useBucketSharing>;

export function SharePanel({
    visible,
    onClose,
    state,
}: {
    visible: boolean;
    onClose: () => void;
    state: SharingState;
}) {
    const theme = useTheme();
    const focus = useFocusRing();
    const [email, setEmail] = useState('');
    const [confirming, setConfirming] = useState(false);
    const { sharing, busy, error } = state;

    const close = () => {
        setConfirming(false);
        state.clearError();
        onClose();
    };

    const invite = async () => {
        if (!email.trim() || busy) return;
        if (await state.invite(email.trim())) setEmail('');
    };

    const unlink = async () => {
        if (await state.unlink()) close();
    };

    let content;
    if (!sharing) {
        content = null;
    } else if (sharing.partner && confirming) {
        content = (
            <>
                <ThemedText type="subtitle" style={styles.title}>
                    Smettere di condividere con {sharing.partner.name}?
                </ThemedText>
                <ThemedText themeColor="textMuted" style={styles.center}>
                    Ognuno tiene una copia di tutte le stagioni, e le modifiche
                    non si vedranno più dall’altra parte.
                </ThemedText>
                <SheetButton onPress={unlink} disabled={busy} danger>
                    Smetti di condividere
                </SheetButton>
                <SheetButton onPress={() => setConfirming(false)} divider>
                    Annulla
                </SheetButton>
            </>
        );
    } else if (sharing.partner) {
        content = (
            <>
                <ThemedText type="subtitle" style={styles.title}>
                    Condividi con {sharing.partner.name}
                </ThemedText>
                <ThemedText themeColor="textMuted" style={styles.center}>
                    Vedete e modificate le stesse stagioni.
                </ThemedText>
                <SheetButton onPress={() => setConfirming(true)} danger>
                    Smetti di condividere
                </SheetButton>
            </>
        );
    } else if (sharing.outgoing) {
        content = (
            <>
                <ThemedText type="subtitle" style={styles.title}>
                    In attesa di {sharing.outgoing.name}
                </ThemedText>
                <ThemedText themeColor="textMuted" style={styles.center}>
                    {sharing.outgoing.email} vedrà l’invito nella sua bucket
                    list.
                </ThemedText>
                <SheetButton onPress={state.cancel} disabled={busy} danger>
                    Annulla invito
                </SheetButton>
            </>
        );
    } else {
        content = (
            <>
                <ThemedText type="subtitle" style={styles.title}>
                    Condividi la bucket list
                </ThemedText>
                <ThemedText themeColor="textMuted" style={styles.center}>
                    Scrivi l’email del suo account. Vedrà l’invito quando apre
                    la bucket list.
                </ThemedText>
                <TextInput
                    value={email}
                    onChangeText={setEmail}
                    onSubmitEditing={invite}
                    onFocus={focus.onFocus}
                    onBlur={focus.onBlur}
                    placeholder="Email"
                    placeholderTextColor={theme.textMuted}
                    accessibilityLabel="Email"
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    returnKeyType="send"
                    style={[
                        styles.input,
                        {
                            color: theme.text,
                            backgroundColor: theme.backgroundElement,
                        },
                        focus.ring,
                    ]}
                />
                <SheetButton
                    onPress={invite}
                    disabled={busy || !email.trim()}
                    accent>
                    Invita
                </SheetButton>
            </>
        );
    }

    return (
        <Sheet visible={visible} onClose={close}>
            <View style={styles.sheet}>
                {content}
                {error && (
                    <ThemedText
                        type="small"
                        themeColor="danger"
                        style={styles.center}>
                        {error}
                    </ThemedText>
                )}
            </View>
            {!confirming && (
                <SheetButton onPress={close} divider>
                    Chiudi
                </SheetButton>
            )}
        </Sheet>
    );
}

export function IncomingInvites({
    state,
    style,
}: {
    state: SharingState;
    style?: StyleProp<ViewStyle>;
}) {
    const theme = useTheme();
    const invites = state.sharing?.incoming ?? [];
    if (!invites.length || state.sharing?.partner) return null;

    return (
        <View style={[styles.invites, style]}>
            {invites.map((invite) => (
                <View
                    key={invite.id}
                    style={[
                        styles.invite,
                        { backgroundColor: theme.backgroundElement },
                    ]}>
                    <ThemedText>
                        {invite.name} ti invita a condividere la bucket list.
                    </ThemedText>
                    <View style={styles.inviteButtons}>
                        <Pressable
                            onPress={() => state.answer(invite.id, true)}
                            disabled={state.busy}
                            accessibilityRole="button"
                            style={({ pressed }) => pressed && styles.pressed}>
                            <ThemedText themeColor="accent" style={styles.bold}>
                                Accetta
                            </ThemedText>
                        </Pressable>
                        <Pressable
                            onPress={() => state.answer(invite.id, false)}
                            disabled={state.busy}
                            accessibilityRole="button"
                            style={({ pressed }) => pressed && styles.pressed}>
                            <ThemedText themeColor="textMuted">
                                Rifiuta
                            </ThemedText>
                        </Pressable>
                    </View>
                </View>
            ))}
            {state.error && (
                <ThemedText type="small" themeColor="danger">
                    {state.error}
                </ThemedText>
            )}
        </View>
    );
}

function SheetButton({
    onPress,
    disabled,
    danger,
    accent,
    divider,
    children,
}: {
    onPress: () => void;
    disabled?: boolean;
    danger?: boolean;
    accent?: boolean;
    divider?: boolean;
    children: string;
}) {
    const theme = useTheme();
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            style={({ pressed }) => [
                styles.sheetButton,
                divider && { borderTopWidth: 1, borderTopColor: theme.border },
                (pressed || disabled) && styles.pressed,
            ]}>
            <ThemedText
                themeColor={danger ? 'danger' : accent ? 'accent' : 'text'}>
                {children}
            </ThemedText>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    sheet: {
        padding: Spacing.three,
        gap: Spacing.two,
    },
    title: {
        textAlign: 'center',
    },
    center: {
        textAlign: 'center',
    },
    input: {
        fontSize: 16,
        borderRadius: 12,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.three,
        marginTop: Spacing.two,
    },
    sheetButton: {
        alignItems: 'center',
        paddingVertical: Spacing.three,
    },
    invites: {
        gap: Spacing.two,
    },
    invite: {
        borderRadius: 12,
        padding: Spacing.three,
        gap: Spacing.two,
    },
    inviteButtons: {
        flexDirection: 'row',
        gap: Spacing.four,
    },
    bold: {
        fontFamily: 'Karla_600SemiBold',
    },
    pressed: {
        opacity: 0.6,
    },
});
