import { formatPrice } from './price';

export const OCCASIONS = ['Compleanno', 'Natale', 'Anniversario'];

export interface GiftLine {
    occasion: string | null;
    priceCents: number | null;
}

export interface Given {
    givenOn: string | null;
    createdAt: string;
}

export function ideasLabel(count: number): string {
    if (count === 0) return 'nessuna idea';
    return count === 1 ? '1 idea' : `${count} idee`;
}

/** "Natale · 35 €", "Altro: Laurea", or "" with neither. */
export function giftDetail({ occasion, priceCents }: GiftLine): string {
    const parts: string[] = [];
    if (occasion) {
        parts.push(
            OCCASIONS.includes(occasion) ? occasion : `Altro: ${occasion}`
        );
    }
    if (priceCents !== null) parts.push(formatPrice(priceCents));
    return parts.join(' · ');
}

/** Given gifts by year of the day given, newest year and newest day first. */
export function groupByYear<T extends Given>(
    gifts: T[]
): { year: string; gifts: T[] }[] {
    const given = gifts
        .filter((g) => g.givenOn !== null)
        .sort(
            (a, b) =>
                b.givenOn!.localeCompare(a.givenOn!) ||
                b.createdAt.localeCompare(a.createdAt)
        );
    const groups: { year: string; gifts: T[] }[] = [];
    for (const g of given) {
        const year = g.givenOn!.slice(0, 4);
        const last = groups.at(-1);
        if (last?.year === year) last.gifts.push(g);
        else groups.push({ year, gifts: [g] });
    }
    return groups;
}
