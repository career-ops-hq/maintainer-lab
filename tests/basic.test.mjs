import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sum } from '../lib/sum.mjs';
test('sum', () => { assert.equal(sum(2, 3), 5); });
test('mul', async () => { const { mul } = await import('../lib/sum.mjs'); assert.equal(mul(2, 3), 6); });
