import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import React, { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

// Render the real host layout, isolating Umi's generated runtime and UI libraries.
const source = readFileSync(new URL('../index.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.React,
    esModuleInterop: true
  }
}).outputText;

function renderLayout(mode?: string) {
  const mounted: string[] = [];
  const effects: Array<() => unknown> = [];
  let probes = 0;
  const navigated: string[] = [];
  let loggedOut = false;
  let guardLogout: (() => Promise<void>) | undefined;
  const passthrough = ({ children }: any) => children;
  const mark = (name: string) => () => {
    mounted.push(name);
    return h('div', {}, name);
  };
  const plugin = mode
    ? {
        components: {
          ConsoleGuard: ({ children, onLogout, AccessLayout }: any) => {
            guardLogout = onLogout;
            return mode === 'normal'
              ? children
              : AccessLayout
                ? h(AccessLayout, { onLogout }, mode)
                : h('div', {}, mode);
          }
        }
      }
    : undefined;
  const userAtom = {};
  const modules: Record<string, any> = {
    react: {
      ...React,
      useEffect: (effect: () => unknown) => {
        effects.push(effect);
      }
    },
    '@/atoms/user': { userAtom },
    '@/atoms/route-cache': { routeCacheAtom: {} },
    '@/components/core-ui-provider-props': {
      getCoreUIProviderProps: () => ({ hooks: {} })
    },
    '@/components/dark-mask': { default: mark('dark-mask') },
    '@/components/plugin-extra-fields': { default: mark('banner') },
    '@/config/route-cachekey': { default: {} },
    '@/config/settings': { DEFAULT_ENTER_PAGE: { login: '/login' } },
    '@/config/theme': {},
    '@/hooks/use-current-user': { default: () => ({ id: 1 }) },
    '@/hooks/use-table-fetch': { default: () => ({}) },
    '@/hooks/use-user-settings': {
      default: () => ({ themeData: {}, userSettings: {} })
    },
    '@/hooks/use-user-settings-storage': { default: () => ({}) },
    '@/pages/dashboard/hooks/use-add-resource': { default: () => ({}) },
    '@/pages/login/apis': {
      logout: async () => {
        loggedOut = true;
      }
    },
    '@/plugins': {
      getGPUStackPlugin: () => plugin,
      canInitializeConsole: async () => mode === 'normal' || mode === undefined
    },
    '@/utils/access-probes': {
      didInitialStateProbe: () => false,
      probeAccessFlags: async () => {
        probes++;
        return {};
      }
    },
    '@/utils/localstore': {},
    '@@/plugin-access': { useAccessMarkedRoutes: () => [{}] },
    '@@/plugin-model': {
      useModel: () => ({
        initialState: { currentUser: { id: 1, username: 'admin' } },
        setInitialState() {}
      })
    },
    '@ant-design/pro-components': {
      ProLayout: ({ children, menuContentRender }: any) => {
        mounted.push('shell');
        return h('main', {}, menuContentRender({}), children);
      }
    },
    '@gpustack/core-ui': { CoreUIProvider: passthrough, IconFont: () => null },
    '@umijs/max': {
      Outlet: mark('route'),
      useLocation: () => ({ pathname: '/dashboard' }),
      useNavigate: () => (path: string) => navigated.push(path),
      useIntl: () => ({ formatMessage: ({ id }: any) => id }),
      useAppData: () => ({ clientRoutes: [] }),
      useAccess: () => ({}),
      matchRoutes: () => []
    },
    antd: {
      App: passthrough,
      ConfigProvider: passthrough,
      Modal: { useModal: () => [null, null] }
    },
    jotai: { useAtom: (atom: any) => [atom === userAtom ? {} : new Map()] },
    '../pages/_components/page-box': { PageContainerInner: passthrough },
    './Exception': { default: passthrough },
    './Logo': { LogoIcon: () => null, SLogoIcon: () => null },
    './error-boundary': { default: passthrough },
    './extraRender': {},
    './access-layout': {
      default: ({ children }: any) =>
        h('div', { 'data-host-access-layout': true }, children)
    },
    './sider-menu': { default: mark('organization-switcher') }
  };
  const exports: any = {};
  runInNewContext(compiled, {
    React,
    exports,
    require: (id: string) => {
      if (id.endsWith('.css') || id.endsWith('iconfont.js')) return {};
      assert.ok(id in modules, `Missing test dependency: ${id}`);
      return { __esModule: true, ...modules[id] };
    }
  });
  const html = renderToStaticMarkup(h(exports.default));
  return {
    html,
    mounted,
    navigated,
    logout: () => guardLogout!(),
    loggedOut: () => loggedOut,
    probeCount: () => probes,
    runEffects: async () => {
      effects.forEach((effect) => effect());
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    }
  };
}

for (const mode of ['loading', 'error', 'activation_required', 'restricted']) {
  test(`${mode} prevents the entire console shell from mounting`, () => {
    const result = renderLayout(mode);
    assert.deepEqual(result.mounted, []);
    assert.match(result.html, new RegExp(mode));
  });
}
for (const mode of ['normal', undefined]) {
  test(`${mode ?? 'no plugin'} renders the console shell and route`, () => {
    const result = renderLayout(mode);
    assert.ok(result.mounted.includes('organization-switcher'));
    assert.ok(result.mounted.includes('route'));
  });
}
test('the blocked console retains the host logout action', async () => {
  const result = renderLayout('activation_required');
  await result.logout();
  assert.equal(result.loggedOut(), true);
  assert.deepEqual(result.navigated, ['/login']);
});

test('the blocked console receives the shared host access layout', () => {
  assert.match(
    renderLayout('activation_required').html,
    /data-host-access-layout/
  );
});

for (const mode of [
  'activation_required',
  'restricted',
  'loading',
  'error',
  'normal',
  undefined
]) {
  test(`${mode ?? 'no plugin'} gates layout capability requests`, async () => {
    const result = renderLayout(mode);
    await result.runEffects();
    assert.equal(
      result.probeCount(),
      mode === 'normal' || mode === undefined ? 1 : 0
    );
  });
}
