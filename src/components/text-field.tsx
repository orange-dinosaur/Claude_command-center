import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useFocusRing } from '@/hooks/use-focus-ring';
import { useTheme } from '@/hooks/use-theme';

interface TextFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    keyboardType?: TextInputProps['keyboardType'];
    /** Several lines, up to 5000 characters instead of 200. */
    multiline?: boolean;
    onBlur?: () => void;
    autoFocus?: boolean;
}

/** A text input with a small muted label above it. */
export function TextField({
    label,
    value,
    onChange,
    placeholder,
    keyboardType,
    multiline,
    onBlur,
    autoFocus,
}: TextFieldProps) {
    const theme = useTheme();
    const focus = useFocusRing();

    return (
        <View style={styles.group}>
            <ThemedText type="small" themeColor="textMuted">
                {label}
            </ThemedText>
            <TextInput
                value={value}
                onChangeText={onChange}
                onFocus={focus.onFocus}
                onBlur={() => {
                    focus.onBlur();
                    onBlur?.();
                }}
                placeholder={placeholder}
                placeholderTextColor={theme.textMuted}
                keyboardType={keyboardType}
                multiline={multiline}
                autoFocus={autoFocus}
                maxLength={multiline ? 5000 : 200}
                accessibilityLabel={label}
                style={[
                    styles.input,
                    multiline && styles.multiline,
                    {
                        color: theme.text,
                        backgroundColor: theme.backgroundElement,
                    },
                    focus.ring,
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    group: {
        gap: Spacing.one,
    },
    input: {
        fontSize: 16,
        // Matches the text line height so it lines up with the date fields.
        lineHeight: 24,
        borderRadius: 12,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
    },
    multiline: {
        minHeight: 72,
        textAlignVertical: 'top',
    },
});
