// Run with `bun src/tools.check.ts`.
import assert from 'node:assert/strict';

import { arrange, TOOLS } from './tools';

const keys = (saved: Parameters<typeof arrange>[0]) =>
    arrange(saved).map((t) => (t.hidden ? `-${t.key}` : t.key));
const all = TOOLS.map((t) => t.key);

assert.deepEqual(keys(null), all);
assert.deepEqual(keys([]), all);

const reversed = [...all].reverse();
assert.deepEqual(
    keys(reversed.map((key) => ({ key, hidden: false }))),
    reversed
);

assert.deepEqual(
    keys(all.map((key) => ({ key, hidden: key === 'sport' }))),
    all.map((key) => (key === 'sport' ? '-sport' : key))
);

assert.deepEqual(
    keys([
        { key: 'gone', hidden: false },
        ...all.map((key) => ({ key, hidden: false })),
    ]),
    all
);

// Saved list without Glimmers and Media: they go last, visible.
assert.deepEqual(
    keys(
        reversed
            .filter((key) => key !== 'glimmers' && key !== 'media')
            .map((key) => ({ key, hidden: true }))
    ),
    [
        ...reversed
            .filter((key) => key !== 'glimmers' && key !== 'media')
            .map((key) => `-${key}`),
        'media',
        'glimmers',
    ]
);

// A repeated key keeps its first place and flag.
assert.deepEqual(
    keys([
        { key: 'sport', hidden: true },
        { key: 'media', hidden: false },
        { key: 'sport', hidden: false },
    ]),
    ['-sport', 'media', ...all.filter((k) => k !== 'sport' && k !== 'media')]
);

console.log('tools: ok');
