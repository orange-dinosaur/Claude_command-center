// bun src/health/order.check.ts
import assert from 'node:assert/strict';

import { placeCheckup, placeMedicine } from '@/health/order';
import type { Health, Medicine } from '@/hooks/use-health';

const m = (id: string, fields: Partial<Medicine> = {}): Medicine => ({
    id,
    name: id,
    frequency: null,
    startDate: null,
    endDate: null,
    createdAt: '2026-09-01T10:00:00.000Z',
    ...fields,
});
const ids = (list: { id: string }[]) => list.map((x) => x.id);
const today = '2026-09-30';

const health: Health = {
    checkups: [
        { id: 'a', name: 'Dentista', lastDate: '2026-01-10' },
        { id: 'b', name: 'Oculista', lastDate: null },
    ],
    ongoing: [m('x', { startDate: '2026-09-01' })],
    ended: [m('y', { endDate: '2026-08-01' })],
};

// Check-ups: oldest last visit first, never visited last, then by name.
assert.deepEqual(
    ids(placeCheckup(health, { id: 'c', name: 'Analisi', lastDate: null }).checkups),
    ['a', 'c', 'b']
);
assert.deepEqual(
    ids(placeCheckup(health, { id: 'b', name: 'Oculista', lastDate: '2025-05-01' }).checkups),
    ['b', 'a']
);

// A medicine ending today is still ongoing; one that ended yesterday moves.
const endsToday = placeMedicine(health, m('x', { endDate: today }), today);
assert.deepEqual([ids(endsToday.ongoing), ids(endsToday.ended)], [['x'], ['y']]);
const ended = placeMedicine(health, m('x', { endDate: '2026-09-29' }), today);
assert.deepEqual([ids(ended.ongoing), ids(ended.ended)], [[], ['x', 'y']]);

// A new ongoing medicine without a start date goes after dated ones.
assert.deepEqual(ids(placeMedicine(health, m('z'), today).ongoing), ['x', 'z']);

console.log('health order ok');
