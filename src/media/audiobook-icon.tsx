import { SymbolView } from 'expo-symbols';
import { View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/** Headphones at the end of a list row. */
export function AudiobookIcon({ selected }: { selected: boolean }) {
    const theme = useTheme();

    return (
        <View accessibilityRole="image" accessibilityLabel="Audiolibro">
            <SymbolView
                name={{
                    ios: 'headphones',
                    android: 'headphones',
                    web: 'headphones',
                }}
                tintColor={selected ? theme.onAccent : theme.textMuted}
                size={18}
            />
        </View>
    );
}
