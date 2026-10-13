/**
 * "Oggi · 18:40": the day opens the app's calendar, the time the browser's
 * own time picker.
 */

import { StyleSheet, View } from 'react-native';

import { DateField } from '@/components/date-field';
import { ThemedText } from '@/components/themed-text';
import { TimeField } from '@/components/time-field';
import { Spacing } from '@/constants/theme';
import { addDays, formatShortDay, toDay, todayDay } from '@/dates';

/** A local day `YYYY-MM-DD` and time `HH:MM`. */
export interface Moment {
    day: string;
    time: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** The local day and time of an ISO moment, or of now. */
export function momentOf(iso?: string): Moment {
    const d = iso ? new Date(iso) : new Date();
    return {
        day: toDay(d.getFullYear(), d.getMonth() + 1, d.getDate()),
        time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    };
}

/** The ISO string of a local moment. */
export const toIso = ({ day, time }: Moment) =>
    new Date(`${day}T${time}`).toISOString();

export const isFuture = (moment: Moment) =>
    new Date(`${moment.day}T${moment.time}`).getTime() > Date.now();

function dayLabel(day: string): string {
    const today = todayDay();
    if (day === today) return 'Oggi';
    if (day === addDays(today, -1)) return 'Ieri';
    return formatShortDay(day);
}

export function MomentField({
    value,
    onChange,
}: {
    value: Moment;
    onChange: (value: Moment) => void;
}) {
    return (
        <View style={styles.line}>
            <DateField
                value={value.day}
                onChange={(day) => day && onChange({ ...value, day })}
                label="Giorno"
                pastOnly>
                <ThemedText type="small" themeColor="accent">
                    {dayLabel(value.day)}
                </ThemedText>
            </DateField>
            <ThemedText type="small" themeColor="textMuted">
                ·
            </ThemedText>
            <TimeField
                value={value.time}
                onChange={(time) => onChange({ ...value, time })}
                label="Ora"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    line: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.one,
    },
});
