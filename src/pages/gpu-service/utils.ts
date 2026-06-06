import _ from 'lodash';

export const omitPathParams = <T extends Record<string, any>>(
  params: T
): Omit<T, 'namespace' | 'clusterID'> => {
  return _.omit(params, [
    'namespace',
    'clusterID',
    'page',
    'perPage',
    'cluster_id'
  ]) as Omit<T, 'namespace' | 'clusterID'>;
};

export const parseQuantityToNumber = (value?: string | null): number | null => {
  if (!value) return null;
  const match = /^(-?\d+(?:\.\d+)?)/.exec(String(value));
  if (!match) return null;
  const num = Number(match[1]);
  return Number.isFinite(num) && num > 0 ? num : null;
};

const UNIT_FACTOR: Record<string, number> = {
  '': 1,
  n: 1e-9,
  u: 1e-6,
  m: 1e-3,
  k: 1e3,
  M: 1e6,
  G: 1e9,
  T: 1e12,
  P: 1e15,
  E: 1e18,
  Ki: 1024,
  Mi: 1024 ** 2,
  Gi: 1024 ** 3,
  Ti: 1024 ** 4,
  Pi: 1024 ** 5,
  Ei: 1024 ** 6
};

export const parseQuantity = (
  value?: string | null
): { num: number; unit: string; base: number } | null => {
  if (value == null) return null;
  const str = String(value).trim();
  const len = str.length;
  if (len === 0) return null;

  let unit = '';
  let numEnd = len;
  if (len >= 2 && str[len - 1] === 'i') {
    unit = str.slice(len - 2);
    if (UNIT_FACTOR[unit] === undefined) return null;
    numEnd = len - 2;
  } else {
    const last = str[len - 1];
    const code = last.charCodeAt(0);
    const isDigit = code >= 48 && code <= 57;
    if (!isDigit && UNIT_FACTOR[last] !== undefined) {
      unit = last;
      numEnd = len - 1;
    }
  }

  if (numEnd === 0) return null;
  const num = Number(str.slice(0, numEnd));
  if (!Number.isFinite(num)) return null;
  const base = num * UNIT_FACTOR[unit];
  if (!Number.isFinite(base)) return null;

  return { num, unit, base };
};

export const parseQuantityToGi = (
  value?: string | null
): { value: number; unit: string; num: number } | null => {
  if (!value) return null;
  const normalized = String(value).replace(
    /(ki|mi|gi|ti|pi|ei)$/i,
    (m) => m[0].toUpperCase() + m[1].toLowerCase()
  );
  const parsed = parseQuantity(normalized);

  if (!parsed || parsed.base <= 0) return null;

  return {
    value: _.floor(parsed.base / UNIT_FACTOR.Gi, 0),
    unit: parsed.unit,
    num: parsed.num
  };
};

export const ceilMilliToCore = (
  value?: string | null,
  unit?: string
): { cores: number; unit: string; num: number } | null => {
  const parsed = parseQuantity(value);
  if (!parsed) return null;
  const outUnit = unit ?? parsed.unit;
  const outFactor = UNIT_FACTOR[outUnit];
  if (outFactor === undefined) return null;
  return {
    cores: _.floor(parsed.base),
    unit: outUnit,
    num: parsed.base / outFactor
  };
};

export const parseJsonSafe = <T>(value: string, fallback: T): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};
