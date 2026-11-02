/**
 * The order `GET /api/titles?kind=` lists titles in, for every title at once
 * and for a saved one.
 */

import type { Kind, Sections, Status, Title } from '@/hooks/use-titles';
import { asc, desc, upsert, without } from '@/order';

const ORDER: Record<Title['status'], (a: Title, b: Title) => number> = {
    doing: (a, b) =>
        desc(a.startDate, b.startDate) || desc(a.createdAt, b.createdAt),
    todo: (a, b) => asc(a.createdAt, b.createdAt),
    done: (a, b) =>
        desc(a.endDate, b.endDate) || desc(a.createdAt, b.createdAt),
};

/** Splits a flat list of titles by kind and status, each list sorted. */
export function byKind(titles: Title[]): Record<Kind, Sections> {
    const list = (kind: Kind, status: Status) =>
        titles
            .filter((t) => t.kind === kind && t.status === status)
            .sort(ORDER[status]);
    const sections = (kind: Kind): Sections => ({
        doing: list(kind, 'doing'),
        todo: list(kind, 'todo'),
        done: list(kind, 'done'),
    });
    return {
        book: sections('book'),
        film: sections('film'),
        series: sections('series'),
    };
}

export function place(sections: Sections, saved: Title): Sections {
    const next: Sections = {
        doing: without(sections.doing, saved.id),
        todo: without(sections.todo, saved.id),
        done: without(sections.done, saved.id),
    };
    next[saved.status] = upsert(next[saved.status], saved, ORDER[saved.status]);
    return next;
}
