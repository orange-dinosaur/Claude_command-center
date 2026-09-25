/**
 * The signed-in user's titles of every kind, split by status in the order the
 * API gives them.
 */

import { apiFetch } from '@/auth/client';
import { useOnFocus } from '@/hooks/use-on-focus';

export type Kind = 'book' | 'film' | 'series';
export type Status = 'doing' | 'todo' | 'done';

export interface Title {
    id: string;
    kind: Kind;
    name: string;
    author: string | null;
    format: string | null;
    season: number | null;
    status: Status;
    startDate: string | null;
    endDate: string | null;
    /** Half stars, 1 to 10. */
    rating: number | null;
}

export type Sections = Record<Status, Title[]>;

const KINDS: Kind[] = ['book', 'film', 'series'];

const empty = (): Sections => ({ doing: [], todo: [], done: [] });

const json = (res: Response) => (res.ok ? res.json() : Promise.reject());

export function useTitles() {
    const { data, error, reload } = useOnFocus<Record<Kind, Sections>>(
        () =>
            Promise.all(
                KINDS.map((kind) =>
                    apiFetch(`/api/titles?kind=${kind}`).then(json)
                )
            ).then(([book, film, series]) => ({ book, film, series })),
        'Non riesco a caricare i dati.'
    );
    // undefined while loading the first time; a failed first load is empty.
    const titles =
        data === null
            ? { book: empty(), film: empty(), series: empty() }
            : data;

    return { titles, error, reload };
}
