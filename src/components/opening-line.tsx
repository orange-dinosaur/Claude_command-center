import { useEffect, useSyncExternalStore } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { markOpening, openingLine, subscribeOpening } from '@/open-timing';

export function OpeningLine() {
    const line = useSyncExternalStore(
        subscribeOpening,
        openingLine,
        () => null
    );

    useEffect(() => {
        markOpening('js');
    }, []);

    if (!line) return null;

    return (
        <ThemedText type="small" themeColor="textMuted" style={styles.line}>
            {line}
        </ThemedText>
    );
}

const styles = StyleSheet.create({
    line: {
        paddingHorizontal: Spacing.four,
        paddingBottom: Spacing.two,
    },
});
