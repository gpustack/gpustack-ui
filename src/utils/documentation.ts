const DOCUMENTATION_HOSTS = new Set([
  'docs.gpustack.ai',
  'docs.gpustack-enterprise.ai'
]);
const DOCUMENTATION_LANGUAGES = new Set(['en', 'zh', 'ja', 'ru', 'tr']);

/** Route product documentation through the bundled site and its online fallback. */
export const getDocumentationUrl = (link = '', locale = 'en-US'): string => {
  const target = new URL(link || '/', 'https://docs.gpustack.ai/');
  if (
    /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(link) &&
    (!DOCUMENTATION_HOSTS.has(target.hostname) ||
      target.pathname.startsWith('/gpustack-operator/'))
  ) {
    return link;
  }

  const requestedLanguage = locale.toLowerCase().split(/[-_]/)[0];
  const language = DOCUMENTATION_LANGUAGES.has(requestedLanguage)
    ? requestedLanguage
    : 'en';
  const path = target.pathname
    .replace(/^\/(?:help|latest|v?\d[^/]*)(?=\/|$)/, '')
    .replace(/^\/(?:en|zh|ja|ru|tr)(?=\/|$)/, '')
    .replace(/^\/+/, '');
  const prefix = language === 'en' ? '' : `${language}/`;
  return `/help/${prefix}${path}${target.search}${target.hash}`;
};
