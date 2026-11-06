import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

let branding: Record<string, unknown> | undefined;
mock.module(new URL('../plugins/index.ts', import.meta.url).href, {
  namedExports: {
    getGPUStackPlugin: () => (branding ? { branding } : undefined)
  }
});
const { default: access } = await import('../access');

test('only platform admins without a branding plugin see the built-in settings editor', () => {
  assert.equal(access({}).canManageSiteSettings, false);
  assert.equal(
    access({ currentUser: { is_admin: false } as Global.UserInfo })
      .canManageSiteSettings,
    false
  );
  assert.equal(
    access({ currentUser: { is_admin: true } as Global.UserInfo })
      .canManageSiteSettings,
    true
  );
  branding = {};
  assert.equal(
    access({ currentUser: { is_admin: true } as Global.UserInfo })
      .canManageSiteSettings,
    false
  );
});
