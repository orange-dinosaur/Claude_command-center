import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useFocusRing } from '@/hooks/use-focus-ring';
import { useTheme } from '@/hooks/use-theme';

interface TextFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}

/** A one-line text input with a small muted label above it. */
export function TextField({
    label,
    value,
    onChange,
    placeholder,
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
                onBlur={focus.onBlur}
                placeholder={placeholder}
                placeholderTextColor={theme.textMuted}
                maxLength={200}
                accessibilityLabel={label}
                style={[
                    styles.input,
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
});
