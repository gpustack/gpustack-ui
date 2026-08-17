import { getLocale } from '@umijs/max';
import defaultMessages from './en-US';
import { registerMessages } from './registry';

/**
 * Locales Umi still bundles eagerly, via the require.context merge their barrels
 * kept (src/locales/en-US.ts, src/locales/zh-CN.ts). English and Chinese cover
 * the bulk of usage, so they stay in the entry chunk: the common paths then pay
 * no extra round trip before the first paint, which is what an async pack would
 * cost while `render` in src/app.tsx holds the mount back.
 */
const EAGER_LOCALES = ['en-US', 'zh-CN'];

/**
 * 'lazy-once' collapses one language's 21 files into a single async chunk, so
 * switching to Japanese fetches Japanese alone. Written out one entry per
 * language because require.context needs a statically analysable path — building
 * the path from a template literal would defeat the split entirely.
 */
const contexts: Record<string, () => any> = {
  // @ts-ignore
  'ja-JP': () => require.context('./ja-JP', false, /\.ts$/, 'lazy-once'),
  // @ts-ignore
  'ru-RU': () => require.context('./ru-RU', false, /\.ts$/, 'lazy-once'),
  // @ts-ignore
  'tr-TR': () => require.context('./tr-TR', false, /\.ts$/, 'lazy-once')
};

const loaded = new Set<string>(EAGER_LOCALES);

/**
 * Registers `locale`'s messages, fetching its chunk the first time it is asked
 * for. Resolves to whether the language is usable, so a caller can hold off the
 * switch and leave the user on a language they can still read. An unknown locale
 * — `getLocale()` falls back to `navigator.language`, which need not be one we
 * ship — is a no-op, same as before.
 */
export const ensureLocaleMessages = async (locale: string) => {
  if (loaded.has(locale) || !contexts[locale]) {
    return true;
  }

  try {
    const context = contexts[locale]();
    // keys() stays synchronous in 'lazy-once' mode; only context(fileName) goes to
    // the network, and every key after the first resolves out of that same chunk.
    const modules = await Promise.all(
      context.keys().map((fileName: string) => context(fileName))
    );
    // The per-file exports are already flat ('common.button.add': '...'), which is
    // the shape the registry passes straight through.
    registerMessages(
      'host',
      locale,
      Object.assign({}, ...modules.map((module: any) => module.default))
    );
    loaded.add(locale);
    return true;
  } catch {
    // Register the bundled English copy under the failed locale's name, so a pack
    // that could not be fetched still reads as text rather than as raw message
    // keys. Deliberately not recorded in `loaded`, so a later attempt retries.
    registerMessages('host', locale, defaultMessages);
    return false;
  }
};

export const ensureCurrentLocaleMessages = () =>
  ensureLocaleMessages(getLocale());
