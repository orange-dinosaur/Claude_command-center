import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { apiUrl } from '@/auth/client';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * A cover, or a grey box when there is none or the image fails to load. With
 * `name`, the grey box shows it. With `fill`, the cover takes its parent's
 * width at 2:3.
 */
export function Cover({
    url,
    large = false,
    fill = false,
    name,
}: {
    url: string | null;
    large?: boolean;
    fill?: boolean;
    name?: string;
}) {
    const theme = useTheme();
    const [failed, setFailed] = useState<string | null>(null);
    const showImage = url !== null && url !== failed;

    return (
        <View
            style={[
                styles.box,
                fill ? styles.fill : large ? styles.large : styles.small,
                { backgroundColor: theme.border },
            ]}>
            {showImage ? (
                <Image
                    source={{ uri: url.startsWith('/') ? apiUrl(url) : url }}
                    contentFit="cover"
                    style={styles.image}
                    onError={() => setFailed(url)}
                    accessibilityIgnoresInvertColors
                />
            ) : (
                name && (
                    <ThemedText
                        type="small"
                        themeColor="textMuted"
                        numberOfLines={4}
                        style={styles.name}>
                        {name}
                    </ThemedText>
                )
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    box: {
        borderRadius: 4,
        overflow: 'hidden',
    },
    small: {
        width: 40,
        height: 60,
    },
    large: {
        width: 64,
        height: 96,
    },
    fill: {
        width: '100%',
        aspectRatio: 2 / 3,
        justifyContent: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    // A margin, not padding: padding would show the lines the clamp cuts.
    name: {
        marginHorizontal: Spacing.two,
        textAlign: 'center',
    },
});
