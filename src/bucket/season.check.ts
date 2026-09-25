// Run with `bun src/bucket/season.check.ts`.
import assert from 'node:assert/strict';

import { nextSeason, seasonKey, seasonLabel, seasonOf } from './season';

assert.deepEqual(seasonOf('2026-03-20'), { year: 2025, season: 'inverno' });
assert.deepEqual(seasonOf('2026-03-21'), { year: 2026, season: 'primavera' });
assert.deepEqual(seasonOf('2027-01-01'), { year: 2026, season: 'inverno' });
assert.deepEqual(seasonOf('2026-09-22'), { year: 2026, season: 'estate' });
assert.deepEqual(seasonOf('2026-09-23'), { year: 2026, season: 'autunno' });
assert.deepEqual(seasonOf('2026-12-21'), { year: 2026, season: 'inverno' });

assert.deepEqual(nextSeason({ year: 2026, season: 'autunno' }), {
    year: 2026,
    season: 'inverno',
});
assert.deepEqual(nextSeason({ year: 2026, season: 'inverno' }), {
    year: 2027,
    season: 'primavera',
});
assert.ok(
    seasonKey({ year: 2027, season: 'primavera' }) >
        seasonKey({ year: 2026, season: 'inverno' })
);

assert.equal(seasonLabel({ year: 2026, season: 'estate' }), 'Estate 2026');
assert.equal(seasonLabel({ year: 2026, season: 'inverno' }), 'Inverno 2026/27');
assert.equal(seasonLabel({ year: 2099, season: 'inverno' }), 'Inverno 2099/00');

console.log('season: ok');
