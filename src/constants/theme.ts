export const Colors = {
    light: {
        text: '#1C2430',
        textMuted: '#5E6A78',
        background: '#F5F6F8',
        backgroundElement: '#FFFFFF',
        accent: '#3F6E8C',
    },
    dark: {
        text: '#E8ECF1',
        textMuted: '#98A3B0',
        background: '#11161C',
        backgroundElement: '#1C242D',
        accent: '#8DB6D1',
    },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Spacing = {
    half: 2,
    one: 4,
    two: 8,
    three: 16,
    four: 24,
    five: 32,
    six: 64,
} as const;
