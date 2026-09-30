// bun src/media/order.check.ts
import assert from 'node:assert/strict';

import type { Sections, Title } from '@/hooks/use-titles';
import { place } from '@/media/order';

const t = (id: string, fields: Partial<Title> = {}): Title => ({
    id,
    kind: 'book',
    name: id,
    author: null,
    format: null,
    season: null,
    status: 'todo',
    startDate: null,
    endDate: null,
    rating: null,
    createdAt: `2026-09-0${id.length}T10:00:00.000Z`,
    ...fields,
});
const ids = (list: Title[]) => list.map((x) => x.id);

const sections: Sections = {
    doing: [
        t('a', { status: 'doing', startDate: '2026-09-10' }),
        t('bb', { status: 'doing', startDate: null }),
    ],
    todo: [t('c'), t('dd')],
    done: [t('e', { status: 'done', endDate: '2026-08-01' })],
};

// A new todo goes last, oldest first.
assert.deepEqual(ids(place(sections, t('fff')).todo), ['c', 'dd', 'fff']);

// A new doing sorts by start date, and one without a date goes last.
assert.deepEqual(
    ids(
        place(sections, t('g', { status: 'doing', startDate: '2026-09-20' }))
            .doing
    ),
    ['g', 'a', 'bb']
);

// Moving a todo to done leaves todo and lands by end date.
const moved = place(
    sections,
    t('c', { status: 'done', endDate: '2026-09-01' })
);
assert.deepEqual(ids(moved.todo), ['dd']);
assert.deepEqual(ids(moved.done), ['c', 'e']);

// An edit in place replaces the row without duplicating it.
const renamed = place(sections, t('dd', { name: 'nuovo' }));
assert.deepEqual(ids(renamed.todo), ['c', 'dd']);
assert.equal(renamed.todo[1].name, 'nuovo');

// Equal start dates fall back to newest first.
assert.deepEqual(
    ids(
        place(sections, t('hhhh', { status: 'doing', startDate: '2026-09-10' }))
            .doing
    ),
    ['hhhh', 'a', 'bb']
);

console.log('order ok');
