import { registerMessages } from '@/locales/registry';
import { getLocale } from '@umijs/max';
import { getGPUStackPlugin } from './index';

/**
 * Fetches the plugin's pack for `locale` when the plugin keeps that language out
 * of its bundled `locales` — the enterprise plugin ships en-US and zh-CN inline
 * and leaves ja-JP / ru-RU / tr-TR to an async chunk each, matching what the host
 * does in src/locales/load-messages.ts. Resolves to whether the language is
 * usable, so `ensureLocaleMessages` can hold a switch back on a failed fetch.
 *
 * A locale with no loader (open source, or one of the bundled two) is a no-op
 * success — `mergeEnterpriseLocales` has already registered it, or there is no
 * plugin at all.
 *
 * Deliberately not deduped: `import()` caches the module itself, so re-calling a
 * loader costs a microtask, while a module-level Set here would break HMR the
 * same way it did for the eager merge below.
 */
export async function ensurePluginLocale(locale: string): Promise<boolean> {
  const loader = getGPUStackPlugin()?.localeLoaders?.[locale];
  if (!loader) {
    return true;
  }

  try {
    const pack = await loader();
    registerMessages('plugin', locale, pack.default);
    return true;
  } catch (error) {
    console.error(`Failed to load enterprise locale ${locale}:`, error);
    return false;
  }
}

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

  // The render() gate in src/app.tsx runs before the plugin is registered, so
  // ensureLocaleMessages could not have reached a loader for the active language.
  // Kick it off here and deliberately do not await: blocking on it would hold the
  // first paint behind the plugin chunk, and a late arrival repaints on its own —
  // addLocale emits LANG_CHANGE_EVENT whenever the locale it registers is the
  // active one, which is what already carries the eager merge above.
  void ensurePluginLocale(getLocale());
}
