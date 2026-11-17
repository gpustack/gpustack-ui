const GIB = 1073741824n;
const DECIMAL_SCALE = BigInt('1000000000000000000000000000000');

/** Preserve an existing byte limit exactly when editing it in GiB. */
export function capacityGiBValue(bytes: number): string {
  const value = (BigInt(bytes) * DECIMAL_SCALE) / GIB;
  const whole = value / DECIMAL_SCALE;
  const fraction = (value % DECIMAL_SCALE)
    .toString()
    .padStart(30, '0')
    .replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : `${whole}`;
}

/** Convert a decimal GiB input to the nearest whole byte without float drift. */
export function capacityLimitBytes(
  unlimited: boolean,
  input: string | null
): number | null {
  if (unlimited) return 0;
  const value = input?.trim() || '';
  if (value.length > 64 || !/^\d+(\.\d{0,30})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  const scale = BigInt('1' + '0'.repeat(fraction.length));
  const decimal = BigInt(whole + fraction);
  const bytes = (decimal * GIB + scale / 2n) / scale;
  if (bytes < 1n || bytes > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  return Number(bytes);
}

export function formatCapacityBytes(bytes: number): string {
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
  const exponent =
    bytes > 0 ? Math.min(5, Math.floor(Math.log2(bytes) / 10)) : 0;
  return `${(bytes / 1024 ** exponent).toLocaleString(undefined, {
    maximumFractionDigits: 2
  })} ${units[exponent]}`;
}
