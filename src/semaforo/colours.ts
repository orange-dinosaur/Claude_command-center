/** Semaforo's four colour lists, in display order. The database checks the same keys. */
export const COLOURS = [
    { key: 'red', label: 'nope' },
    { key: 'orange', label: 'mmmmh' },
    { key: 'yellow', label: 'sometimes' },
    { key: 'green', label: 'yes' },
] as const;

export type Colour = (typeof COLOURS)[number]['key'];

export const NAME_MAX = 100;

export function isColour(value: unknown): value is Colour {
    return COLOURS.some((c) => c.key === value);
}
