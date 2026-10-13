/**
 * The browser's own time input, so the iPhone shows its wheel. The value is
 * `HH:MM`. Web only, like the rest of the app.
 */

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

export function TimeField({
    value,
    onChange,
    label,
}: {
    value: string;
    onChange: (value: string) => void;
    label: string;
}) {
    const theme = useTheme();
    const scheme = useColorScheme();
    return (
        <input
            type="time"
            value={value}
            // Clearing the field on the Mac gives ''; keep the last time.
            onChange={(e) => e.target.value && onChange(e.target.value)}
            aria-label={label}
            style={{
                fontFamily: 'Karla_400Regular',
                fontSize: 14,
                lineHeight: '20px',
                // The clock icon follows the app's theme, not the system's.
                colorScheme: scheme,
                color: theme.accent,
                background: 'transparent',
                border: 0,
                padding: 0,
            }}
        />
    );
}
