import {
    DarkTheme,
    DefaultTheme,
    Stack,
    ThemeProvider,
    type Theme,
} from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

function navigationTheme(scheme: 'light' | 'dark'): Theme {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
        ...base,
        colors: {
            ...base.colors,
            background: Colors[scheme].background,
            primary: Colors[scheme].accent,
        },
    };
}

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        <ThemeProvider value={navigationTheme(colorScheme)}>
            <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
    );
}
