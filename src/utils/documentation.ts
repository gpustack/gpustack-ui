const DOCUMENTATION_LANGUAGES = new Set(['en', 'zh', 'ja', 'ru', 'tr']);

/** Build a bundled URL from a product documentation path. */
export const getDocumentationUrl = (path = '', locale = 'en-US'): string => {
  const requestedLanguage = locale.toLowerCase().split(/[-_]/)[0];
  const language = DOCUMENTATION_LANGUAGES.has(requestedLanguage)
    ? requestedLanguage
    : 'en';
  const suffixIndex = path.search(/[?#]/);
  const pathname = suffixIndex < 0 ? path : path.slice(0, suffixIndex);
  const suffix = suffixIndex < 0 ? '' : path.slice(suffixIndex);
  const pagePath = pathname
    .replace(/^\/+/, '')
    .replace(/^(?:help|latest|v?\d[^/]*)(?:\/|$)/, '')
    .replace(/^(?:en|zh|ja|ru|tr)(?:\/|$)/, '');
  const prefix = language === 'en' ? '' : `${language}/`;
  return `/help/${prefix}${pagePath}${suffix}`;
};
