import { addLocale } from '@umijs/max';

const mergedLocales = new Set<string>();

/**
 * Merge enterprise plugin locales into the main application
 */
export function mergeEnterpriseLocales(locales: Record<string, any> = {}) {
  if (!locales) {
    return;
  }

  console.log('Merging enterprise plugin locales:', Object.keys(locales));

  // Iterate over all locale configurations of the enterprise plugin
  Object.entries(locales).forEach(([locale, messages]) => {
    try {
      if (mergedLocales.has(locale)) {
        return;
      }

      // Merge the enterprise locale into the main application
      addLocale(locale, messages, {
        momentLocale: '',
        // @ts-ignore
        antd: locale
      });
      mergedLocales.add(locale);
      console.log(`✓ Merged enterprise locale: ${locale}`);
    } catch (error) {
      console.error(`Failed to merge enterprise locale ${locale}:`, error);
    }
  });
}
