import { Image } from 'expo-image';
import { Link, usePathname, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import {
    Pressable,
    StyleSheet,
    View,
    type PressableStateCallbackType,
} from 'react-native';

import { MARK } from './auth-form';
import { ThemedText } from './themed-text';

import { authClient } from '@/auth/client';
import { Spacing } from '@/constants/theme';
import { setColorScheme, useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

// react-native-web passes `hovered` to the style callback; the types omit it.
type State = PressableStateCallbackType & { hovered?: boolean };

// The rail renders on desktop web only, so the icons need only web names.
const items: { label: string; title: string; href: Href; icon: string }[] = [
    { label: 'Home', title: 'Home', href: '/', icon: 'home' },
    {
        label: 'Closeout',
        title: 'Monthly closeout',
        href: '/monthly-closeout',
        icon: 'calendar_month',
    },
    {
        label: 'Salute',
        title: 'Salute',
        href: '/salute',
        icon: 'monitor_heart',
    },
    { label: 'Media', title: 'Media', href: '/media', icon: 'local_library' },
    {
        label: 'Creatività',
        title: 'Creatività',
        href: '/creativita',
        icon: 'palette',
    },
    { label: 'Sport', title: 'Sport', href: '/sport', icon: 'directions_run' },
];

// react-native-web drops the `title` prop, so the tooltip goes on the DOM node.
const tooltip = (title: string) => (node: unknown) => {
    if (node) (node as HTMLElement).title = title;
};

export function Rail() {
    const theme = useTheme();
    const scheme = useColorScheme();
    const pathname = usePathname();

    const isActive = (href: string) =>
        href === '/' ? pathname === '/' : pathname.startsWith(href);

    return (
        <View
            style={[styles.rail, { backgroundColor: theme.backgroundElement }]}>
            <Image source={MARK[scheme]} style={styles.logo} />
            <View style={styles.nav}>
                {items.map((item) => {
                    const active = isActive(item.href as string);
                    const color = active ? theme.onAccent : theme.text;
                    return (
                        <Link key={item.label} href={item.href} asChild>
                            {/* Link drops a style function, so the state styles go on an inner View. */}
                            <Pressable ref={tooltip(item.title)}>
                                {({ pressed, hovered }: State) => (
                                    <View
                                        style={[
                                            styles.item,
                                            active && {
                                                backgroundColor: theme.accent,
                                            },
                                            !active &&
                                                hovered && {
                                                    backgroundColor:
                                                        theme.background,
                                                },
                                            pressed && styles.pressed,
                                        ]}>
                                        <SymbolView
                                            name={{ web: item.icon as never }}
                                            tintColor={color}
                                            size={24}
                                        />
                                        <ThemedText
                                            style={[styles.label, { color }]}
                                            numberOfLines={1}>
                                            {item.label}
                                        </ThemedText>
                                    </View>
                                )}
                            </Pressable>
                        </Link>
                    );
                })}
            </View>
            <View style={styles.spacer} />
            <View style={styles.actions}>
                <Pressable
                    ref={tooltip(
                        scheme === 'dark' ? 'Tema chiaro' : 'Tema scuro'
                    )}
                    accessibilityRole="button"
                    accessibilityLabel={
                        scheme === 'dark' ? 'Tema chiaro' : 'Tema scuro'
                    }
                    onPress={() =>
                        setColorScheme(scheme === 'dark' ? 'light' : 'dark')
                    }
                    style={({ pressed, hovered }: State) => [
                        styles.button,
                        hovered && { backgroundColor: theme.background },
                        pressed && styles.pressed,
                    ]}>
                    <SymbolView
                        name={{
                            web: scheme === 'dark' ? 'light_mode' : 'dark_mode',
                        }}
                        tintColor={theme.textMuted}
                        size={24}
                    />
                </Pressable>
                {/* The auth guard sees the session end and replaces the page with login. */}
                <Pressable
                    ref={tooltip('Esci')}
                    accessibilityRole="button"
                    accessibilityLabel="Esci"
                    onPress={() => authClient.signOut()}
                    style={({ pressed, hovered }: State) => [
                        styles.button,
                        hovered && { backgroundColor: theme.background },
                        pressed && styles.pressed,
                    ]}>
                    <SymbolView
                        name={{ web: 'logout' }}
                        tintColor={theme.danger}
                        size={24}
                    />
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    rail: {
        width: 88,
        alignItems: 'center',
        gap: Spacing.four,
        paddingTop: Spacing.five,
        paddingHorizontal: Spacing.two,
        paddingBottom: Spacing.three,
    },
    logo: {
        width: 40,
        height: 40,
        borderRadius: 10,
    },
    nav: {
        alignSelf: 'stretch',
        gap: Spacing.two,
    },
    item: {
        alignItems: 'center',
        gap: Spacing.one,
        paddingVertical: Spacing.two,
        paddingHorizontal: Spacing.one,
        borderRadius: 12,
    },
    label: {
        fontFamily: 'Karla_600SemiBold',
        fontSize: 11,
        lineHeight: 14,
    },
    spacer: {
        flex: 1,
    },
    actions: {
        gap: Spacing.two,
    },
    button: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pressed: {
        opacity: 0.6,
    },
});
