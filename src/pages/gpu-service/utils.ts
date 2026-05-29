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

const GI_FROM_UNIT: Record<string, number> = {
  Ki: 1 / (1024 * 1024),
  Mi: 1 / 1024,
  Gi: 1,
  Ti: 1024
};

// Converts a K8s-style quantity ("24314504Ki", "2Ti", "10Gi", or a bare
// number assumed to be bytes) to an integer GiB. Unit suffix is
// case-insensitive.
export const parseQuantityToGi = (value?: string | null): number | null => {
  if (!value) return null;
  const match = /^(-?\d+(?:\.\d+)?)(Ki|Mi|Gi|Ti)?$/i.exec(String(value));
  if (!match) return null;
  const num = Number(match[1]);
  if (!Number.isFinite(num) || num <= 0) return null;
  const unit = match[2]
    ? match[2][0].toUpperCase() + match[2].slice(1).toLowerCase()
    : null;
  const factor = unit ? GI_FROM_UNIT[unit] : 1 / (1024 * 1024 * 1024);
  return Math.floor(num * factor);
};

export const ceilMilliToCore = (value?: string | null): string | null => {
  if (!value) return null;
  const match = /^(-?\d+(?:\.\d+)?)m?$/.exec(value);
  if (!match) return null;
  const num = Number(match[1]);
  if (!Number.isFinite(num)) return null;
  return String(Math.ceil(num / 1000));
};
