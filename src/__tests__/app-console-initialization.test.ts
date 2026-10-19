import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import React from 'react';
import ts from 'typescript';

function loadSource(relative: string, modules: Record<string, any>) {
  const source = readFileSync(new URL(relative, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true
    }
  });
  const exports: any = {};
  runInNewContext(outputText, {
    exports,
    React,
    console: { error() {} },
    require: (id: string) => {
      if (id.endsWith('.css')) return {};
      assert.ok(id in modules, `Missing test dependency: ${id}`);
      return { __esModule: true, ...modules[id] };
    }
  });
  return exports;
}
function application(
  permission: boolean | 'error' | 'oss',
  pathname = '/settings',
  admin = true
) {
  const calls: string[] = [];
  const plugin =
    permission === 'oss'
      ? undefined
      : {
          canInitializeConsole: async () => {
            if (permission === 'error') throw new Error('unavailable');
            return permission;
          },
          login: { onUserFetched: async () => {} }
        };
  const plugins = loadSource('../plugins/index.ts', {
    './manager': { GPUStackPluginManager: { get: () => plugin } }
  });
  const exports = loadSource('../app.tsx', {
    '@/atoms/settings': {},
    '@/atoms/user': {},
    '@/atoms/utils': { setAtomStorage() {} },
    '@/components/public-page-provider': {},
    '@/config/settings': { DEFAULT_ENTER_PAGE: { login: '/login' } },
    '@/config/theme/constants': {},
    '@/layouts/error-boundary': {},
    '@/locales/load-messages': {},
    '@/plugins': plugins,
    '@/plugins/enterprise-ready': { enterprisePluginReady: Promise.resolve() },
    '@/plugins/manager': {
      GPUStackPluginManager: {
        initialize: async () => ({}),
        getAll: () => new Map()
      }
    },
    '@/plugins/public-routes': { isPluginPublicPage: () => false },
    '@/request-config': { requestConfig: {} },
    '@/services/profile/apis': {
      queryCurrentUserState: async () => {
        calls.push('identity');
        return { id: 1, username: 'admin', is_admin: admin };
      },
      queryVersionInfo: async () => {
        calls.push('version');
        return { version: '0.0.0' };
      },
      updateCheck: async () => {
        calls.push('update');
        return {};
      }
    },
    '@/services/system/query-system-config': {
      fetchSystemConfig: () => {
        calls.push('config');
      }
    },
    '@/utils': { isOnline: () => false },
    '@/utils/access-probes': {
      markInitialStateProbed: () => {
        calls.push('marked');
      },
      probeAccessFlags: async () => {
        calls.push('clusters');
        calls.push('resource-events');
        return { hasKubernetesCluster: false };
      }
    },
    '@/utils/install-fetch': { installTenantFetch() {} },
    '@/utils/localstore/index': {
      readState: async () => true,
      writeState() {}
    },
    '@umijs/max': {
      history: { location: { pathname }, push() {} },
      request: async () => ({})
    },
    antd: { message: { error: () => calls.push('toast') } }
  });
  return { getInitialState: exports.getInitialState, calls };
}
for (const permission of [false, 'error'] as const) {
  test(`blocked or unknown console access skips business bootstrap (${permission})`, async () => {
    const app = application(permission);
    const state = await app.getInitialState();
    assert.equal(state.currentUser.username, 'admin');
    assert.deepEqual(app.calls, ['version', 'identity']);
    assert.equal(state.hasKubernetesCluster, undefined);
  });
  test(`SPA login skips administrator business requests (${permission})`, async () => {
    const app = application(permission, '/login');
    const state = await app.getInitialState();
    await state.fetchUserInfo();
    assert.deepEqual(app.calls, ['version', 'identity']);
  });
}
for (const permission of [true, 'oss'] as const) {
  test(`normal access preserves business bootstrap (${permission})`, async () => {
    const app = application(permission);
    const state = await app.getInitialState();
    assert.equal(state.currentUser.username, 'admin');
    assert.equal(state.hasKubernetesCluster, false);
    assert.deepEqual(app.calls, [
      'version',
      'identity',
      'update',
      'config',
      'clusters',
      'resource-events',
      'marked'
    ]);
  });
}
test('non-admin normal access still probes capabilities without admin configuration', async () => {
  const app = application(true, '/settings', false);
  await app.getInitialState();
  assert.deepEqual(app.calls, [
    'version',
    'identity',
    'clusters',
    'resource-events',
    'marked'
  ]);
});
