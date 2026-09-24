import { StyleSheet, Text, type TextProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
    type?: 'default' | 'title' | 'subtitle' | 'small';
    themeColor?: ThemeColor;
};

export function ThemedText({
    style,
    type = 'default',
    themeColor,
    ...rest
}: ThemedTextProps) {
    const theme = useTheme();

    return (
        <Text
            style={[
                { color: theme[themeColor ?? 'text'] },
                styles[type],
                style,
            ]}
            {...rest}
        />
    );
}

const styles = StyleSheet.create({
    default: {
        fontFamily: 'Karla_400Regular',
        fontSize: 16,
        lineHeight: 24,
    },
    title: {
        fontFamily: 'CormorantGaramond_600SemiBold',
        fontSize: 36,
        lineHeight: 40,
    },
    subtitle: {
        fontFamily: 'CormorantGaramond_600SemiBold',
        fontSize: 26,
        lineHeight: 30,
    },
    small: {
        fontFamily: 'Karla_400Regular',
        fontSize: 14,
        lineHeight: 20,
    },
});
