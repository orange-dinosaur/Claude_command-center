import { formatPrice } from './price';

export const OCCASIONS = ['Compleanno', 'Natale', 'Anniversario'];

export interface GiftLine {
    occasion: string | null;
    priceCents: number | null;
    bought?: boolean;
}

export interface Given {
    givenOn: string | null;
    createdAt: string;
}

/** "3 idee", or "3 idee · 1 comprata" when some are bought. */
export function ideasLabel(count: number, bought = 0): string {
    if (count === 0) return 'nessuna idea';
    const ideas = count === 1 ? '1 idea' : `${count} idee`;
    if (bought === 0) return ideas;
    return `${ideas} · ${bought} ${bought === 1 ? 'comprata' : 'comprate'}`;
}

/** "Comprato · Natale · 35 €", "Altro: Laurea", or "" with nothing to say. */
export function giftDetail({ occasion, priceCents, bought }: GiftLine): string {
    const parts: string[] = [];
    if (bought) parts.push('Comprato');
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
