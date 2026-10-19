const DOCUMENTATION_LANGUAGE_MAP = new Map([
  ['en-US', 'en'],
  ['zh-CN', 'zh'],
  ['ja-JP', 'ja'],
  ['ru-RU', 'ru'],
  ['tr-TR', 'tr']
]);

/** Build a bundled URL from a product documentation path. */
export const getDocumentationUrl = (path = '', locale = 'en-US'): string => {
  const language = DOCUMENTATION_LANGUAGE_MAP.get(locale) ?? 'en';
  const prefix = language === 'en' ? '' : `${language}/`;
  return `/help/${prefix}${path}`;
};
