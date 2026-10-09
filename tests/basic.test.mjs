import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sum } from '../lib/sum.mjs';
test('sum', () => { assert.equal(sum(2, 3), 5); });
test('sub', async () => { const { sub } = await import('../lib/sum.mjs'); assert.equal(sub(5, 3), 2); });
