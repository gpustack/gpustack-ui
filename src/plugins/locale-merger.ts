import { registerMessages } from '@/locales/registry';

/**
 * Merge enterprise plugin locales into the main application.
 *
 * Goes through the locale registry rather than calling `addLocale` directly. The
 * plugin overrides a handful of host keys, and the host's own language packs for
 * the lazily loaded locales arrive in a separate async chunk — whichever lands
 * second would otherwise win, because `addLocale` is last-write-wins. The
 * registry recomposes both layers in a fixed precedence instead, so the plugin's
 * overrides survive a language switch made long after boot.
 *
 * Re-calling this with the latest message dict is still safe and still intended:
 * a previous version deduped via a module-level Set and that broke HMR — newly
 * added keys in plugin locale files were skipped on the second merge, leaving the
 * placeholder/validation strings unresolved until a full server restart.
 */
export function mergeEnterpriseLocales(locales: Record<string, any> = {}) {
  if (!locales) {
    return;
  }

  Object.entries(locales).forEach(([locale, messages]) => {
    try {
      registerMessages('plugin', locale, messages);
    } catch (error) {
      console.error(`Failed to merge enterprise locale ${locale}:`, error);
    }
  });
}
