/**
 * The signed-in user's titles of every kind, split by status.
 */

import { useRef } from 'react';

import { apiFetch } from '@/auth/client';
import { todayDay } from '@/dates';
import { useOnFocus } from '@/hooks/use-on-focus';
import { tapEpisode } from '@/media/episodes';
import { byKind, place } from '@/media/order';

export type Kind = 'book' | 'film' | 'series';
export type Status = 'doing' | 'todo' | 'done';

export interface Title {
    id: string;
    kind: Kind;
    name: string;
    author: string | null;
    language: string | null;
    format: string | null;
    season: number | null;
    episodes: number | null;
    /** Episodes watched, counted from the first. */
    watched: number;
    status: Status;
    startDate: string | null;
    endDate: string | null;
    /** Half stars, 1 to 10. */
    rating: number | null;
    /** ISO timestamp, only for ordering. */
    createdAt: string;
}

export type Sections = Record<Status, Title[]>;

const empty = (): Sections => ({ doing: [], todo: [], done: [] });

const json = (res: Response) => (res.ok ? res.json() : Promise.reject());

export function useTitles() {
    const { data, setData, error, setError, reload } = useOnFocus<
        Record<Kind, Sections>
    >(
        () => apiFetch('/api/titles').then(json).then(byKind),
        'Non riesco a caricare i dati.'
    );
    // undefined while loading the first time; a failed first load is empty.
    const titles =
        data === null
            ? { book: empty(), film: empty(), series: empty() }
            : data;

    /** Takes a deleted title off the lists before the reload. */
    const drop = (id: string) =>
        setData((current) => {
            if (!current) return current;
            const without = (sections: Sections): Sections => ({
                doing: sections.doing.filter((t) => t.id !== id),
                todo: sections.todo.filter((t) => t.id !== id),
                done: sections.done.filter((t) => t.id !== id),
            });
            return {
                book: without(current.book),
                film: without(current.film),
                series: without(current.series),
            };
        });

    /** Shows a saved title in its place before the reload. */
    const put = (saved: Title) =>
        setData(
            (current) =>
                current && {
                    ...current,
                    [saved.kind]: place(current[saved.kind], saved),
                }
        );

    // Taps on one title go out one after another, so they reach the server in
    // order.
    const pending = useRef(new Map<string, Promise<unknown>>());

    /**
     * Marks episodes watched up to `episode`, as a tap on its dot does.
     * Resolves to whether the server saved it.
     */
    const watch = async (title: Title, episode: number) => {
        const changes = tapEpisode(title, episode, todayDay());
        setError(null);
        put({ ...title, ...changes });
        const request = (pending.current.get(title.id) ?? Promise.resolve())
            .catch(() => {})
            .then(() =>
                apiFetch(`/api/titles/${title.id}`, {
                    method: 'PATCH',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify(changes),
                })
            )
            .then((res) => {
                if (!res.ok) throw new Error();
            });
        pending.current.set(title.id, request);
        try {
            await request;
            return true;
        } catch {
            put(title);
            setError('Non riesco a salvare l’episodio.');
            return false;
        }
    };

    return { titles, error, reload, drop, put, watch };
}
