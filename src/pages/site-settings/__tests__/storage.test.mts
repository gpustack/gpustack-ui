import * as jotai from 'jotai';
import { getDefaultStore } from 'jotai';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { createTestDOM } from './test-dom.mts';

// Keep the ESM test and tsx's CJS consumers on the same real Jotai store.
mock.module('jotai', { namedExports: { ...jotai } });
const dom = createTestDOM();
after(() => dom.window.close());
const local = new Map<string, string>();
const nsLocal = {
  get: (key: string) => local.get(key) ?? null,
  set: (key: string, value: string) => {
    local.set(key, value);
  },
  remove: (key: string) => {
    local.delete(key);
  }
};
mock.module('@gpustack/core-ui/utils', {
  namedExports: {
    nsLocal,
    nsSession: nsLocal,
    nsLocalJSONStorage: {
      getItem: (key: string, initial: any) =>
        local.has(key) ? JSON.parse(local.get(key)!) : initial,
      setItem: (key: string, value: any) =>
        nsLocal.set(key, JSON.stringify(value)),
      removeItem: nsLocal.remove
    }
  }
});
mock.module(new URL('../../../config/theme/index.ts', import.meta.url).href, {
  namedExports: { COLOR_PRIMARY: '#007BFF' }
});
const { userSettingsAtom, defaultSettings } =
  await import('../../../atoms/settings');
const { clearStorageUserSettings, resetStorageUserSettings, getAtomStorage } =
  await import('../../../atoms/utils');
const { siteSettingsAtom } = await import('../../../atoms/site-settings');
const { defaultSiteSettings } = await import('../config');
const { applySiteSettings } = await import('../bootstrap');

test('applying branding preserves personal preferences and persists the instance color', () => {
  const store = getDefaultStore();
  store.set(userSettingsAtom, {
    ...defaultSettings,
    theme: 'realDark',
    mode: 'realDark',
    collapsed: true
  });
  applySiteSettings({
    ...defaultSiteSettings,
    site_name: 'Lab',
    primary_color: '#123456'
  });
  const current = store.get(userSettingsAtom);
  assert.equal(current.colorPrimary, '#123456');
  assert.equal(current.theme, 'realDark');
  assert.equal(current.mode, 'realDark');
  assert.equal(current.collapsed, true);
  assert.equal(JSON.parse(local.get('userSettings')!).colorPrimary, '#123456');
  assert.equal(getAtomStorage(siteSettingsAtom).site_name, 'Lab');
});

test('login and password-change preference resets retain the site color', () => {
  nsLocal.set(
    'userSettings',
    JSON.stringify({
      ...defaultSettings,
      colorPrimary: '#654321',
      collapsed: true,
      hideAddResourceModal: true
    })
  );
  clearStorageUserSettings();
  const cleared = JSON.parse(local.get('userSettings')!);
  assert.equal(cleared.colorPrimary, '#654321');
  assert.equal(cleared.hideAddResourceModal, false);
  resetStorageUserSettings();
  assert.deepEqual(JSON.parse(local.get('userSettings')!), {
    ...defaultSettings,
    colorPrimary: '#654321'
  });
});

test('preference reset recovers from malformed stored preferences', () => {
  nsLocal.set('userSettings', '{broken');
  resetStorageUserSettings();
  assert.deepEqual(JSON.parse(local.get('userSettings')!), defaultSettings);
});
