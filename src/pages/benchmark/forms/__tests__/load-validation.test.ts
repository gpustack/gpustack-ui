import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidLoadValue, optionalLoadValueRule } from '../load-validation';

test('request rates accept positive fractions without a minimum positive floor', async () => {
  const rule = optionalLoadValueRule(true, 'Enter a positive request rate');
  for (const value of [0.001, 0.1, 0.5, 1, 1.5, 10]) {
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
