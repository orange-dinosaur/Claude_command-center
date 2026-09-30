/**
 * Puts a saved title where `GET /api/titles` would list it.
 */

import type { Sections, Title } from '@/hooks/use-titles';
import { asc, desc, upsert, without } from '@/order';

const ORDER: Record<Title['status'], (a: Title, b: Title) => number> = {
    doing: (a, b) =>
        desc(a.startDate, b.startDate) || desc(a.createdAt, b.createdAt),
    todo: (a, b) => asc(a.createdAt, b.createdAt),
    done: (a, b) =>
        desc(a.endDate, b.endDate) || desc(a.createdAt, b.createdAt),
};

export function place(sections: Sections, saved: Title): Sections {
    const next: Sections = {
        doing: without(sections.doing, saved.id),
        todo: without(sections.todo, saved.id),
        done: without(sections.done, saved.id),
    };
    next[saved.status] = upsert(
        next[saved.status],
        saved,
        ORDER[saved.status]
    );
    return next;
}
