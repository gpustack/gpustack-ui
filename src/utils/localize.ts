import { getLocale } from '@umijs/max';

/**
 * A user-facing string served by a declarative catalog, either bare or
 * keyed by locale. The backend serves the mapping as declared: the
 * request carries no reliable signal of the locale the user picked in
 * the UI, so resolution happens here.
 */
export type LocalizedText = string | Record<string, string>;

/**
 * Resolve a localized string against the active locale, widening to the
 * base language before falling back to the declaration's canonical text.
 * A locale the catalog does not translate reads as the author wrote it
 * rather than as a blank.
 */
export const localize = (value?: LocalizedText | null): string | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value;
  }
  const locale = getLocale();
  return (
    value[locale] ??
    value[locale.split('-')[0]] ??
    value.default ??
    Object.values(value)[0]
  );
};
