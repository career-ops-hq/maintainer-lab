import { test } from 'node:test';
import assert from 'node:assert/strict';
import { neg, sum } from '../lib/sum.mjs';
test('sum', () => { assert.equal(sum(2, 3), 5); });
test('neg', () => { assert.equal(neg(2), -2); });
