const compare = (actual: number, threshold: number) =>
  actual === threshold ? 0 : actual > threshold ? 1 : -1;

const fractionalDigits = (value: string) => value.split('.')[1]?.length ?? 0;

/** Format both sides without rounding away the threshold comparison. */
export const formatThresholdComparison = (
  actual: number,
  threshold: number
): { actual: string; threshold: string } | null => {
  if (!Number.isFinite(actual) || !Number.isFinite(threshold)) return null;

  const actualValue = actual === 0 ? 0 : actual;
  const thresholdValue = threshold === 0 ? 0 : threshold;
  const relation = compare(actualValue, thresholdValue);
  const [coefficient, exponent = '0'] = thresholdValue.toString().split('e');
  const initialPrecision = Math.max(
    0,
    fractionalDigits(coefficient) - Number(exponent)
  );

  for (let precision = initialPrecision; precision <= 20; precision++) {
    const options = {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    };
    // Use Intl's actual rounding, which can differ from toFixed. An ungrouped
    // English rendering is parseable regardless of the user's separators.
    const rounded = (value: number) =>
      Number(value.toLocaleString('en-US', { ...options, useGrouping: false }));
    if (compare(rounded(actualValue), rounded(thresholdValue)) === relation) {
      return {
        actual: actualValue.toLocaleString(undefined, options),
        threshold: thresholdValue.toLocaleString(undefined, options)
      };
    }
  }

  const scientific = (precision: number) => ({
    actual: actualValue.toExponential(precision),
    threshold: thresholdValue.toExponential(precision)
  });
  const scientificPrecision = fractionalDigits(
    thresholdValue.toExponential().split('e')[0]
  );
  for (let precision = scientificPrecision; precision < 16; precision++) {
    const formatted = scientific(precision);
    if (
      compare(Number(formatted.actual), Number(formatted.threshold)) ===
      relation
    ) {
      return formatted;
    }
  }
  // Seventeen significant digits round-trip every finite IEEE 754 value, so
  // even adjacent subnormal values retain their original comparison.
  return scientific(16);
};
