import { addLocale } from '@umijs/max';

type Messages = Record<string, string>;

/**
 * Message sources, lowest precedence first. The enterprise plugin deliberately
 * overrides a handful of host keys — the four login placeholders and two menu
 * labels among them — so `plugin` has to end up on top.
 */
const LAYERS = ['host', 'plugin'] as const;

type Layer = (typeof LAYERS)[number];

const layers: Record<Layer, Map<string, Messages>> = {
  host: new Map(),
  plugin: new Map()
};

/**
 * Recomposes `locale` from every layer that has arrived so far and hands the
 * result to `addLocale`.
 *
 * Writing the whole composition — rather than just the layer that triggered this
 * — is the entire point. `addLocale` merges with the newest call winning, and the
 * two layers arrive from two independent async chunks: the host's language pack
 * (src/locales/load-messages.ts) and the enterprise plugin bundle (registered by
 * the block the enterprise build appends to global.tsx). Either can land first,
 * so composing from scratch every time is what makes arrival order irrelevant.
 *
 * Keys no layer owns fall through to whatever Umi registered statically, which is
 * how the eagerly bundled locales work without ever getting a `host` entry here.
 */
const compose = (locale: string) => {
  addLocale(
    locale,
    Object.assign({}, ...LAYERS.map((layer) => layers[layer].get(locale))),
    // Left empty so addLocale keeps the antd locale and momentLocale that the
    // static localeInfo entry already carries.
    {} as any
  );
};

/**
 * The single writer of Umi's locale registry — an eslint rule keeps `addLocale`
 * out of the rest of the app, because calling it directly is what reintroduces
 * the ordering bug this module exists to remove.
 */
export const registerMessages = (
  layer: Layer,
  locale: string,
  messages: Messages
) => {
  layers[layer].set(locale, messages);
  compose(locale);
};
