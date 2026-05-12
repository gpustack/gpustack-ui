import { addLocale } from '@umijs/max';

/**
 * Merge enterprise plugin locales into the main application.
 *
 * `addLocale` is idempotent: re-calling with the latest message dict
 * overwrites previous entries, so we always pass the freshest plugin
 * locales through. A previous version deduped via a module-level Set
 * and that broke HMR — newly added keys in plugin locale files were
 * skipped on the second merge, leaving the placeholder/validation
 * strings unresolved until a full server restart.
 */
export function mergeEnterpriseLocales(locales: Record<string, any> = {}) {
  if (!locales) {
    return;
  }

  Object.entries(locales).forEach(([locale, messages]) => {
    try {
      addLocale(locale, messages, {
        momentLocale: '',
        // @ts-ignore
        antd: locale
      });
    } catch (error) {
      console.error(`Failed to merge enterprise locale ${locale}:`, error);
    }
  });
}
