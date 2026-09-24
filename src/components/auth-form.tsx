import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    TextInput,
    View,
    type TextInputProps,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function AuthField({
    label,
    ...input
}: TextInputProps & { label: string }) {
    const theme = useTheme();

    return (
        <View style={styles.field}>
            <ThemedText type="small" themeColor="textMuted">
                {label}
            </ThemedText>
            <TextInput
                style={[
                    styles.input,
                    {
                        color: theme.text,
                        backgroundColor: theme.backgroundElement,
                    },
                ]}
                placeholderTextColor={theme.textMuted}
                accessibilityLabel={label}
                {...input}
            />
        </View>
    );
}

export function SubmitButton({
    title,
    onPress,
    disabled,
    pending,
}: {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    pending?: boolean;
}) {
    const theme = useTheme();
    const inactive = disabled || pending;

    return (
        <Pressable
            onPress={onPress}
            disabled={inactive}
            accessibilityRole="button"
            accessibilityLabel={title}
            style={({ pressed }) => [
                styles.button,
                {
                    backgroundColor: theme.accent,
                    opacity: inactive ? 0.5 : pressed ? 0.8 : 1,
                },
            ]}>
            {pending ? (
                <ActivityIndicator color={theme.background} />
            ) : (
                <ThemedText
                    style={[styles.buttonText, { color: theme.onAccent }]}>
                    {title}
                </ThemedText>
            )}
        </Pressable>
    );
}

export function ErrorText({ children }: { children: string | null }) {
    if (!children) return null;
    return (
        <ThemedText type="small" themeColor="danger">
            {children}
        </ThemedText>
    );
}

const styles = StyleSheet.create({
    field: {
        gap: Spacing.one,
    },
    input: {
        fontSize: 16,
        borderRadius: 12,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.three,
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        minHeight: 52,
        marginTop: Spacing.two,
    },
    buttonText: {
        fontWeight: 600,
    },
});
