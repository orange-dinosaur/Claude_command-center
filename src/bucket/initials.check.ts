// Run with `bun src/bucket/initials.check.ts`.
import assert from 'node:assert/strict';

import { initials } from './initials';

const labels = (...names: string[]) => Object.fromEntries(initials(names));

assert.deepEqual(labels('elisa'), { elisa: 'E' });
assert.deepEqual(labels('Elisa', 'Marco'), { Elisa: 'E', Marco: 'M' });
assert.deepEqual(labels('Elisa', 'Elena'), { Elisa: 'Eli', Elena: 'Ele' });
assert.deepEqual(labels('Marco', 'Mia', 'Elisa'), {
    Marco: 'Ma',
    Mia: 'Mi',
    Elisa: 'E',
});
assert.deepEqual(labels('Ann', 'Anna'), { Ann: 'Ann', Anna: 'Anna' });
assert.deepEqual(labels('Elisa', 'elisa'), { Elisa: 'Elisa', elisa: 'Elisa' });
assert.deepEqual(labels('Elisa', 'Elisa'), { Elisa: 'E' });

console.log('bucket initials: ok');
