import type { ResponsiveFilterConfig } from './types';

export const isFilterActive = <Values extends object>(
  filter: ResponsiveFilterConfig<Values>,
  values: NoInfer<Values>
): boolean => {
  const value = values[filter.key];
  if (filter.isActive) return filter.isActive(value);
  if (Array.isArray(value)) return value.length > 0;
  // 0 and false are valid filter values, unlike an empty input or selection.
  return value !== undefined && value !== null && value !== '';
};

export const getFilterClearPatch = <Values extends object>(
  filters: ResponsiveFilterConfig<Values>[]
): Partial<Values> =>
  Object.fromEntries(
    filters.map((filter) => [
      filter.key,
      'clearValue' in filter
        ? filter.clearValue
        : filter.type === 'input'
          ? ''
          : undefined
    ])
  ) as Partial<Values>;
