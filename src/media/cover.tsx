import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { apiUrl } from '@/auth/client';
import { useTheme } from '@/hooks/use-theme';

/** A cover, or a grey box when there is none or the image fails to load. */
export function Cover({
    url,
    large = false,
}: {
    url: string | null;
    large?: boolean;
}) {
    const theme = useTheme();

    return (
        <View
            style={[
                styles.box,
                large && styles.large,
                { backgroundColor: theme.border },
            ]}>
            {url && (
                <Image
                    source={{ uri: url.startsWith('/') ? apiUrl(url) : url }}
                    contentFit="cover"
                    style={styles.image}
                    accessibilityIgnoresInvertColors
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    box: {
        width: 40,
        height: 60,
        borderRadius: 4,
        overflow: 'hidden',
    },
    large: {
        width: 64,
        height: 96,
    },
    image: {
        width: '100%',
        height: '100%',
    },
});
