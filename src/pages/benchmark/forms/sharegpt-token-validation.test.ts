import assert from 'node:assert/strict';
import test from 'node:test';
import { optionalPositiveIntegerRule } from './sharegpt-token-validation';

const rule = optionalPositiveIntegerRule('Enter a positive integer');

test('optional ShareGPT token lengths accept empty values and positive integers', async () => {
  for (const value of [undefined, null, '', 1, 200]) {
    await assert.doesNotReject(rule.validator({}, value));
  }
});

test('optional ShareGPT token lengths reject invalid numbers', async () => {
  for (const value of [0, -1, 1.5, NaN, Infinity, '2', 2 ** 53]) {
    await assert.rejects(rule.validator({}, value), /Enter a positive integer/);
  }
});
