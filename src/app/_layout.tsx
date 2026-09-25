import { CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond/600SemiBold';
import { Karla_400Regular } from '@expo-google-fonts/karla/400Regular';
import { Karla_500Medium } from '@expo-google-fonts/karla/500Medium';
import { Karla_600SemiBold } from '@expo-google-fonts/karla/600SemiBold';
import { Karla_700Bold } from '@expo-google-fonts/karla/700Bold';
import { useFonts } from 'expo-font';
import {
    DarkTheme,
    DefaultTheme,
    Stack,
    ThemeProvider,
    type Theme,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DESKTOP_MIN_WIDTH, useIsDesktop } from '@/hooks/use-is-desktop';

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

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const isDesktop = useIsDesktop();
    useAuthGuard();
    const [fontsLoaded, fontError] = useFonts({
        CormorantGaramond_600SemiBold,
        Karla_400Regular,
        Karla_500Medium,
        Karla_600SemiBold,
        Karla_700Bold,
    });
    const fontsReady = fontsLoaded || fontError !== null;

    useEffect(() => {
        if (fontsReady) SplashScreen.hideAsync();
    }, [fontsReady]);

    // Lifts the dark-mode hiding in +html.tsx once the scheme matches the stored
    // choice, or the device when there is none.
    useEffect(() => {
        if (Platform.OS !== 'web') return;
        const dark = matchMedia('(prefers-color-scheme: dark)').matches;
        const expected =
            document.documentElement.dataset.scheme ??
            (dark ? 'dark' : 'light');
        if (colorScheme === expected) {
            document.documentElement.dataset.schemeReady = '';
        }
    }, [colorScheme]);

    // Lifts the wide-window hiding in +html.tsx once the layout matches the window.
    useEffect(() => {
        if (Platform.OS !== 'web') return;
        const wide = matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH}px)`).matches;
        if (isDesktop === wide) {
            document.documentElement.dataset.layoutReady = '';
        }
    }, [isDesktop]);

    // On web the server HTML already carries the @font-face rules, so render right away.
    if (!fontsReady && Platform.OS !== 'web') return null;

    return (
        <ThemeProvider value={navigationTheme(colorScheme)}>
            <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
    );
}
