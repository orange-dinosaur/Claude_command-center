import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useToday } from '@/hooks/use-today';

/** Today stacked as weekday, day number and month, for the desktop pages. */
export function DateBlock() {
    // "giovedì 24 settembre": one word each for weekday, day and month.
    const [weekday, day, month] = useToday().split(' ');

    return (
        <View>
            <ThemedText themeColor="textMuted" style={styles.weekday}>
                {weekday}
            </ThemedText>
            <ThemedText style={styles.day}>{day}</ThemedText>
            <ThemedText type="title" style={styles.month}>
                {month}
            </ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    weekday: {
        fontFamily: 'Karla_500Medium',
        fontSize: 14,
        lineHeight: 20,
        textTransform: 'capitalize',
    },
    day: {
        fontFamily: 'CormorantGaramond_600SemiBold',
        fontSize: 64,
        lineHeight: 64,
    },
    month: {
        textTransform: 'capitalize',
    },
});
