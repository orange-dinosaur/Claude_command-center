import { useState } from 'react';
import type { TextStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/** A 2px accent outline on a text field while it has focus. */
export function useFocusRing() {
    const theme = useTheme();
    const [focused, setFocused] = useState(false);

    const ring: TextStyle | undefined = focused
        ? {
              outlineWidth: 2,
              outlineStyle: 'solid',
              outlineColor: theme.accent,
          }
        : undefined;

    return {
        ring,
        onFocus: () => setFocused(true),
        onBlur: () => setFocused(false),
    };
}
