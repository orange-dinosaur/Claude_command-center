// Run with `bun src/media/episodes.check.ts`.
import assert from 'node:assert/strict';

import { tapEpisode } from './episodes';

const today = '2026-10-13';
const season = { episodes: 10, watched: 3, endDate: null };

assert.deepEqual(tapEpisode(season, 5, today), { watched: 5 });
assert.deepEqual(tapEpisode(season, 1, today), { watched: 1 });
assert.deepEqual(tapEpisode(season, 3, today), { watched: 2 });
assert.deepEqual(tapEpisode({ ...season, watched: 1 }, 1, today), {
    watched: 0,
});
assert.deepEqual(tapEpisode(season, 10, today), {
    watched: 10,
    status: 'done',
    endDate: today,
});
assert.deepEqual(tapEpisode({ ...season, endDate: '2026-10-01' }, 10, today), {
    watched: 10,
    status: 'done',
    endDate: '2026-10-01',
});

console.log('episodes: ok');
