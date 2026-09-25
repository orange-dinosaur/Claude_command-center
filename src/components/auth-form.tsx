import {
    ActivityIndicator,
    Image,
    Pressable,
    StyleSheet,
    TextInput,
    View,
    type TextInputProps,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFocusRing } from '@/hooks/use-focus-ring';
import { useTheme } from '@/hooks/use-theme';

export const MARK = {
    light: require('@/assets/images/logo-mark-light.png'),
    dark: require('@/assets/images/logo-mark-dark.png'),
};

/** The logo mark and the screen title at the top of every auth screen. */
export function AuthTitle({ children }: { children: string }) {
    const scheme = useColorScheme();

    return (
        <View>
            <Image source={MARK[scheme]} style={styles.mark} alt="" />
            <ThemedText type="title" style={styles.title}>
                {children}
            </ThemedText>
        </View>
    );
}

export function AuthField({
    label,
    onFocus,
    onBlur,
    ...input
}: TextInputProps & { label: string }) {
    const theme = useTheme();
    const focus = useFocusRing();

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
                    focus.ring,
                ]}
                placeholderTextColor={theme.textMuted}
                accessibilityLabel={label}
                onFocus={(e) => {
                    focus.onFocus();
                    onFocus?.(e);
                }}
                onBlur={(e) => {
                    focus.onBlur();
                    onBlur?.(e);
                }}
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
                <ActivityIndicator color={theme.onAccent} />
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
    mark: {
        width: 56,
        height: 56,
        // The design's 8 below the mark plus the 16 gap between blocks.
        marginBottom: Spacing.four,
    },
    title: {
        fontSize: 40,
        lineHeight: 44,
    },
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
        fontFamily: 'Karla_600SemiBold',
    },
});
