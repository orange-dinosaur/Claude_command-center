/** localStorage key for the theme picked on the web, 'light' or 'dark'. */
export const SCHEME_KEY = 'color-scheme';

export const Colors = {
    light: {
        text: '#2F2A27',
        textMuted: '#736960',
        background: '#F3EEE7',
        backgroundElement: '#FBF8F4',
        accent: '#7C8C6E',
        danger: '#A8452F',
        secondary: '#A14A5A',
        tertiary: '#D8C6B0',
        border: '#DED5C9',
        markEmpty: '#DED5C9',
        onAccent: '#FBF8F4',
        amber: '#B8693A',
        ochre: '#B8923A',
    },
    dark: {
        text: '#ECEAE2',
        textMuted: '#A2A596',
        background: '#171B17',
        backgroundElement: '#222822',
        accent: '#A3B592',
        danger: '#E58A74',
        secondary: '#B35F6D',
        tertiary: '#E1CFB8',
        border: '#343B33',
        markEmpty: '#5A6457',
        onAccent: '#171B17',
        amber: '#E0A070',
        ochre: '#D9BE6E',
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
