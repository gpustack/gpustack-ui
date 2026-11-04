import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidLoadValue, optionalLoadValueRule } from '../load-validation';

test('request rates accept the minimum and preserve fractional precision', async () => {
  const rule = optionalLoadValueRule(true, 'Enter a positive request rate');
  for (const value of [0.001, 0.0011, 0.1, 0.5, 1, 1.5, 10]) {
    assert.equal(isValidLoadValue(value, true), true);
    await assert.doesNotReject(rule.validator({}, value));
  }
});

test('load values reject zero, negatives, non-finite and non-numeric values', async () => {
  for (const fixedRate of [true, false]) {
    const rule = optionalLoadValueRule(fixedRate, 'Invalid load');
    for (const value of [0, -1, NaN, Infinity, -Infinity, '0.1', true, {}]) {
      assert.equal(isValidLoadValue(value, fixedRate), false);
      await assert.rejects(rule.validator({}, value), /Invalid load/);
    }
  }
});

test('concurrency requires safe positive whole stream counts', async () => {
  const rule = optionalLoadValueRule(false, 'Enter a positive integer');
  for (const value of [1, 2, 100]) {
    await assert.doesNotReject(rule.validator({}, value));
  }
  for (const value of [0.1, 0.5, 1.5, 2 ** 53]) {
    assert.equal(isValidLoadValue(value, false), false);
    await assert.rejects(rule.validator({}, value), /positive integer/);
  }
});

test('optional search bounds allow empty values to use runner defaults', async () => {
  for (const fixedRate of [true, false]) {
    const rule = optionalLoadValueRule(fixedRate, 'Invalid load');
    for (const value of [null, undefined, '']) {
      assert.equal(isValidLoadValue(value, fixedRate), false);
      await assert.doesNotReject(rule.validator({}, value));
    }
  }
});

test('manual request rates below 0.001 req/s are rejected', async () => {
  const rule = optionalLoadValueRule(
    true,
    'Request rate must be at least 0.001'
  );
  for (const value of [
    0.0009999999999999998,
    0.0001,
    1e-12,
    Number.MIN_VALUE
  ]) {
    assert.equal(isValidLoadValue(value, true), false);
    await assert.rejects(rule.validator({}, value), /at least 0.001/);
  }
});
