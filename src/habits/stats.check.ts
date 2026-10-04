// Run with `bun src/habits/stats.check.ts`.
import assert from 'node:assert/strict';

import {
    historyMonths,
    isDone,
    mondayOf,
    monthDays,
    monthSummary,
    weekCount,
    weekDays,
    type Tracked,
} from './stats';

const habit = (
    mode: Tracked['mode'],
    days: [string, number?][],
    targets: { weeklyTarget?: number; dailyTarget?: number } = {}
): Tracked => ({
    mode,
    weeklyTarget: targets.weeklyTarget ?? null,
    dailyTarget: targets.dailyTarget ?? null,
    createdAt: '2026-09-10T08:00:00.000Z',
    days: days.map(([date, amount]) => ({ date, amount: amount ?? null })),
});

// Wednesday 30 September 2026; the week crosses into October.
assert.equal(mondayOf('2026-09-30'), '2026-09-28');
assert.equal(mondayOf('2026-09-28'), '2026-09-28');
assert.equal(mondayOf('2026-10-04'), '2026-09-28');
assert.deepEqual(weekDays('2026-09-28').slice(3), [
    '2026-10-01',
    '2026-10-02',
    '2026-10-03',
    '2026-10-04',
]);
assert.equal(monthDays('2026-02').length, 28);
assert.equal(monthDays('2028-02').at(-1), '2028-02-29');

const water = habit(
    'amount',
    [
        ['2026-09-29', 5],
        ['2026-09-30', 8],
    ],
    {
        dailyTarget: 8,
    }
);
assert.equal(isDone(water, '2026-09-29'), false);
assert.equal(isDone(water, '2026-09-30'), true);
assert.equal(isDone(water, '2026-09-28'), false);
assert.equal(weekCount(water, '2026-09-28'), 1);
assert.deepEqual(monthSummary(water, '2026-09'), { done: 1, days: 30 });

// Target 2. Weeks ending in September 2026: the 6th, 13th, 20th and 27th.
// The week of 28 September ends on 4 October, so it counts for October.
const yoga = habit(
    'weekly',
    [
        ['2026-08-31'],
        ['2026-09-02'],
        ['2026-09-08'],
        ['2026-09-21'],
        ['2026-09-22'],
        ['2026-09-29'],
        ['2026-10-01'],
    ],
    { weeklyTarget: 2 }
);
assert.deepEqual(monthSummary(yoga, '2026-09'), {
    done: 5,
    days: 30,
    weeks: { reached: 2, total: 4 },
});
assert.deepEqual(monthSummary(yoga, '2026-10').weeks, { reached: 1, total: 4 });

// History starts at the first marked day when it comes before creation.
assert.deepEqual(historyMonths(yoga, '2026-11-02'), [
    '2026-11',
    '2026-10',
    '2026-09',
    '2026-08',
]);
assert.deepEqual(historyMonths(habit('daily', []), '2027-01-05'), [
    '2027-01',
    '2026-12',
    '2026-11',
    '2026-10',
    '2026-09',
]);

console.log('habit stats: ok');
