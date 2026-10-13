import { Switch as NativeSwitch, type SwitchProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

// Cream in both states and both themes, like the iPhone's white thumb.
const THUMB = '#FBF8F4';

// React Native Web takes the "on" thumb colour separately, and the RN types
// do not know the prop.
const webThumb = { activeThumbColor: THUMB } as object;

export function Switch(props: SwitchProps) {
    const theme = useTheme();
    return (
        <NativeSwitch
            trackColor={{ false: theme.border, true: theme.accent }}
            thumbColor={THUMB}
            {...webThumb}
            {...props}
        />
    );
}
