/**
 * Deliberately empty. Umi's locale plugin statically imports this barrel into the
 * entry chunk, so the require.context merge that used to live here is what put
 * every language's translations on the first paint. The messages are registered
 * at runtime instead — see ./load-messages.ts.
 *
 * The file still has to exist, and still has to default-export an object: Umi
 * needs it to register the locale (so it keeps appearing in `getAllLocales()`,
 * and keeps its antd locale and momentLocale), and `pnpm check:locales` requires
 * a `{lang}.ts` beside every `{lang}/`.
 */
export default {};
