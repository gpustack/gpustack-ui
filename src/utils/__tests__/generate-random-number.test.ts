import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateRandomNumber } from '../index';

test('default draws stay within the qwen-compatible int32 seed range', () => {
  for (let i = 0; i < 2000; i++) {
    const value = generateRandomNumber();
    assert.ok(
      Number.isInteger(value) && value >= 0 && value <= 2147483647,
      `out of default range: ${value}`
    );
  }
});

test('explicit bounds are respected and inclusive', () => {
  const seen = new Set<number>();
  for (let i = 0; i < 2000; i++) {
    const value = generateRandomNumber(5, 10);
    assert.ok(
      Number.isInteger(value) && value >= 5 && value <= 10,
      `out of [5, 10]: ${value}`
    );
    seen.add(value);
  }
  // Enough draws that every value in the small range should have appeared.
  assert.equal(seen.size, 6);
});

test('a caller can opt into a wider range, e.g. the full uint32 space', () => {
  for (let i = 0; i < 2000; i++) {
    const value = generateRandomNumber(0, 4294967295);
    assert.ok(
      Number.isInteger(value) && value >= 0 && value <= 4294967295,
      `out of uint32 range: ${value}`
    );
  }
});
