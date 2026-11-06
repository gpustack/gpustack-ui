import { atom, getDefaultStore } from 'jotai';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

const dom = new JSDOM('<!doctype html><head></head><body></body>', {
  url: 'http://localhost'
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document
});
const preferences = atom({ colorPrimary: '#007BFF' });
mock.module(new URL('../../../atoms/settings.ts', import.meta.url).href, {
  namedExports: { userSettingsHelperAtom: preferences }
});
mock.module(new URL('../../../atoms/utils/index.ts', import.meta.url).href, {
  namedExports: {
    setAtomStorage: (target: any, value: any) =>
      getDefaultStore().set(target, value)
  }
});
const { defaultSiteSettings, resolveSiteLogo } = await import('../config');
const { siteSettingsAtom } = await import('../../../atoms/site-settings');
const { loadSiteSettings, applySiteSettings } = await import('../bootstrap');

test('bootstrap applies public branding with a bounded request and no login requirement', async () => {
  let options: Record<string, unknown> | undefined;
  const settings = await loadSiteSettings(
    async <T,>(url: string, opts?: Record<string, unknown>) => {
      assert.equal(url, '/site-settings/public');
      options = opts;
      return {
        ...defaultSiteSettings,
        site_name: 'Lab',
        primary_color: '#123456',
        favicon: 'data:image/png;base64,iVBORw0KGgo='
      } as T;
    }
  );
  assert.equal(options?.timeout, 5000);
  assert.equal(options?.skipErrorHandler, true);
  assert.equal(document.title, 'Lab');
  assert.equal(getDefaultStore().get(preferences).colorPrimary, '#123456');
  assert.equal(getDefaultStore().get(siteSettingsAtom).site_name, 'Lab');
  assert.equal(
    document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href,
    settings.favicon
  );
});

test('failure and an older server SPA fallback restore usable defaults', async () => {
  for (const request of [
    async () => {
      throw new Error('timeout');
    },
    async <T,>() => '<html>GPUStack</html>' as T
  ]) {
    const settings = await loadSiteSettings(request);
    assert.deepEqual(settings, defaultSiteSettings);
    assert.equal(document.title, 'GPUStack');
    assert.equal(
      new URL(document.querySelector<HTMLLinkElement>('link[rel="icon"]')!.href)
        .pathname,
      '/static/favicon.png'
    );
  }
});

test('clearing assets restores defaults without accumulating favicon elements', () => {
  applySiteSettings(defaultSiteSettings);
  applySiteSettings(defaultSiteSettings);
  assert.equal(document.querySelectorAll('link[rel="icon"]').length, 1);
});

test('dark logos fall back to the light asset, then the built-in asset', () => {
  const settings = {
    ...defaultSiteSettings,
    logo: 'light',
    logo_dark: 'dark',
    mini_logo: 'mini'
  };
  assert.equal(resolveSiteLogo(settings, 'sidebar', true), 'dark');
  assert.equal(resolveSiteLogo(settings, 'sidebar', false), 'light');
  assert.equal(resolveSiteLogo(settings, 'mini', true), 'mini');
  assert.equal(resolveSiteLogo(defaultSiteSettings, 'mini', true), undefined);
});

for (const response of [
  null,
  {},
  { site_name: 123, primary_color: '#123456' },
  { site_name: 'Lab', primary_color: ['#123456'] },
  { site_name: 'Lab', primary_color: null },
  { site_name: 'Lab', primary_color: 'red' }
]) {
  test(`invalid public response ${JSON.stringify(response)} falls back to defaults`, async () => {
    const settings = await loadSiteSettings(async <T,>() => response as T);
    assert.deepEqual(settings, defaultSiteSettings);
    assert.equal(document.title, 'GPUStack');
  });
}

test('a public response without optional assets uses default values', async () => {
  const settings = await loadSiteSettings(
    async <T,>() => ({ site_name: 'Lab', primary_color: '#123456' }) as T
  );
  assert.deepEqual(settings, {
    ...defaultSiteSettings,
    site_name: 'Lab',
    primary_color: '#123456'
  });
});

test('each dark asset falls back independently without using dark images in light mode', () => {
  const settings = {
    ...defaultSiteSettings,
    logo_dark: 'dark-wordmark',
    mini_logo_dark: 'dark-icon'
  };
  assert.equal(resolveSiteLogo(settings, 'sidebar', true), 'dark-wordmark');
  assert.equal(resolveSiteLogo(settings, 'mini', true), 'dark-icon');
  assert.equal(resolveSiteLogo(settings, 'sidebar', false), undefined);
  assert.equal(resolveSiteLogo(settings, 'mini', false), undefined);
});
