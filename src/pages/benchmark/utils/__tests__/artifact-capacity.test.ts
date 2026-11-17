import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  capacityGiBValue,
  capacityLimitBytes,
  formatCapacityBytes
} from '../artifact-capacity';

test('unlimited is explicit zero, independent of a retained finite input', () => {
  assert.equal(capacityLimitBytes(true, null), 0);
  assert.equal(capacityLimitBytes(true, '100'), 0);
});

test('GiB editing round trips existing whole-byte limits without float rounding', () => {
  for (const bytes of [1, 37, 107374182, 2 ** 40, Number.MAX_SAFE_INTEGER]) {
    assert.equal(capacityLimitBytes(false, capacityGiBValue(bytes)), bytes);
  }
  assert.equal(capacityLimitBytes(false, '0.1'), 107374182);
  assert.equal(capacityLimitBytes(false, '1024'), 1099511627776);
});

test('finite limits reject zero, negative, malformed and unsafe values', () => {
  for (const value of [
    null,
    '',
    '0',
    '-1',
    'Infinity',
    '1e6',
    'NaN',
    '8388608'
  ]) {
    assert.equal(capacityLimitBytes(false, value), null, String(value));
  }
});

test('capacity labels preserve zero and use binary units', () => {
  assert.equal(formatCapacityBytes(0), '0 B');
  assert.equal(formatCapacityBytes(1024), '1 KiB');
  assert.equal(formatCapacityBytes(2 ** 40), '1 TiB');
});
