import type { ThemeColor } from '@/constants/theme';

/** Semaforo's four colour lists, in display order. The database checks the same keys. */
export const COLOURS = [
    { key: 'red', label: 'nope', tone: 'danger' },
    { key: 'orange', label: 'mmmmh', tone: 'amber' },
    { key: 'yellow', label: 'sometimes', tone: 'ochre' },
    { key: 'green', label: 'yes', tone: 'accent' },
] as const satisfies readonly {
    key: string;
    label: string;
    tone: ThemeColor;
}[];

export type Colour = (typeof COLOURS)[number]['key'];

export const NAME_MAX = 100;

export function isColour(value: unknown): value is Colour {
    return COLOURS.some((c) => c.key === value);
}
