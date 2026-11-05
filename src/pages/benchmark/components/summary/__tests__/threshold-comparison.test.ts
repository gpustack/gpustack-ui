import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { formatThresholdComparison } from '../threshold-comparison';

const numberToLocaleString = Number.prototype.toLocaleString;
let defaultLocale = 'en-US';
mock.method(
  Number.prototype,
  'toLocaleString',
  function (
    this: number,
    locales?: string | string[],
    options?: Intl.NumberFormatOptions
  ) {
    return numberToLocaleString.call(this, locales ?? defaultLocale, options);
  }
);
after(() => mock.restoreAll());

test('latency excess uses enough shared precision to preserve the verdict', () => {
  assert.deepEqual(formatThresholdComparison(500.0004, 500), {
    actual: '500.0004',
    threshold: '500.0000'
  });
});

test('success rate below the floor stays visibly below it', () => {
  assert.deepEqual(formatThresholdComparison((379 / 399) * 100, 95), {
    actual: '94.99',
    threshold: '95.00'
  });
});

test('comparison retains the threshold meaningful fractional digits', () => {
  assert.deepEqual(formatThresholdComparison(501, 500.4), {
    actual: '501.0',
    threshold: '500.4'
  });
  assert.deepEqual(formatThresholdComparison(2e-7, 1e-7), {
    actual: '0.0000002',
    threshold: '0.0000001'
  });
});

test('equal inputs keep the same displayed value', () => {
  assert.deepEqual(formatThresholdComparison(500.4, 500.4), {
    actual: '500.4',
    threshold: '500.4'
  });
  assert.deepEqual(formatThresholdComparison(-0, 0), {
    actual: '0',
    threshold: '0'
  });
});

test('precision selection follows Intl rounding rather than toFixed rounding', () => {
  assert.deepEqual(formatThresholdComparison(1.005, 1), {
    actual: '1.01',
    threshold: '1.00'
  });
  assert.deepEqual(formatThresholdComparison(-1.005, -1), {
    actual: '-1.01',
    threshold: '-1.00'
  });
});

test('grouping separators do not hide the displayed relation', () => {
  assert.deepEqual(formatThresholdComparison(1000.0004, 1000), {
    actual: '1,000.0004',
    threshold: '1,000.0000'
  });
});

test('decimal commas preserve the same precision and relation', () => {
  defaultLocale = 'de-DE';
  try {
    assert.deepEqual(formatThresholdComparison(1000.0004, 1000), {
      actual: '1.000,0004',
      threshold: '1.000,0000'
    });
  } finally {
    defaultLocale = 'en-US';
  }
});

test('scientific fallback preserves adjacent finite values after the decimal limit', () => {
  assert.deepEqual(formatThresholdComparison(1.0000000000000002e-300, 1e-300), {
    actual: '1.0000000000000002e-300',
    threshold: '1.0000000000000000e-300'
  });
  assert.deepEqual(formatThresholdComparison(Number.MIN_VALUE, 0), {
    actual: '5e-324',
    threshold: '0e+0'
  });
});

test('scientific fallback keeps equal finite values equal', () => {
  assert.deepEqual(formatThresholdComparison(1e-300, 1e-300), {
    actual: '1e-300',
    threshold: '1e-300'
  });
});

test('finite extremes and adjacent values retain their original ordering', () => {
  for (const [actual, threshold] of [
    [0, Number.MIN_VALUE],
    [-Number.MIN_VALUE, 0],
    [0, -Number.MIN_VALUE],
    [Number.MIN_VALUE, Number.MIN_VALUE * 2],
    [Number.MIN_VALUE * 2, Number.MIN_VALUE],
    [Number.MAX_VALUE, Number.MAX_VALUE * (1 - Number.EPSILON)],
    [Number.MAX_VALUE * (1 - Number.EPSILON), Number.MAX_VALUE],
    [-Number.MAX_VALUE, Number.MAX_VALUE],
    [1 + Number.EPSILON, 1],
    [1, 1 + Number.EPSILON],
    [1e-300, 1.0000000000000002e-300]
  ]) {
    const formatted = formatThresholdComparison(actual, threshold);
    assert.ok(formatted);
    const displayedActual = Number(formatted.actual.replaceAll(',', ''));
    const displayedThreshold = Number(formatted.threshold.replaceAll(',', ''));
    assert.equal(
      displayedActual < displayedThreshold,
      actual < threshold,
      `${actual} compared with ${threshold}`
    );
    assert.equal(
      displayedActual > displayedThreshold,
      actual > threshold,
      `${actual} compared with ${threshold}`
    );
  }
});

test('non-finite actuals and thresholds are unavailable', () => {
  for (const value of [NaN, Infinity, -Infinity]) {
    assert.equal(formatThresholdComparison(value, 500), null);
    assert.equal(formatThresholdComparison(500, value), null);
  }
});
