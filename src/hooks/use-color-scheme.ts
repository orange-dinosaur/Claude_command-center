import { useColorScheme as useRNColorScheme } from 'react-native';

// The theme toggle is web only; native always follows the device.
export function setColorScheme(_scheme: 'light' | 'dark') {}

export function useColorScheme(): 'light' | 'dark' {
    return useRNColorScheme() === 'dark' ? 'dark' : 'light';
}
