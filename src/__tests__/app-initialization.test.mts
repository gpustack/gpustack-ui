import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { beforeEach, mock, test } from 'node:test';
import type { AppPlugin, AppPluginContext } from '../plugins/types.ts';

// Match Umi's runtime alias rather than the host's newer direct dependency.
const hostRequire = createRequire(import.meta.url);
const maxRequire = createRequire(
  hostRequire.resolve('@umijs/max/package.json')
);
const umiRequire = createRequire(maxRequire.resolve('umi/package.json'));
const rendererRequire = createRequire(
  umiRequire.resolve('@umijs/renderer-react/package.json')
);
const runtimeRouter = rendererRequire(
  'react-router-dom'
) as typeof import('react-router-dom');
mock.module('react-router-dom', {
  namedExports: { matchRoutes: runtimeRouter.matchRoutes }
});

const { GPUStackPluginManager: originalManager } =
  await import('../plugins/manager.ts');
// The production module exports a singleton. Use its real constructor so each
// scenario exercises initialization caching without sharing state with others.
const Manager = originalManager.constructor as new () => typeof originalManager;
let manager = new Manager();

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};

const location = { pathname: '/public/example' };
const redirects: string[] = [];
const history = {
  get location() {
    return { ...location };
  },
  push: (path: string) => redirects.push(path)
};
const settingsAtom = Symbol('settings');
const userAtom = Symbol('user');
const versionAtom = Symbol('version');
const updateAtom = Symbol('update');
const writes: { atom: unknown; value: any }[] = [];
const requests: string[] = [];
const settings = { displayName: 'Test Plugin', colorPrimary: '#123456' };
const user = { id: 7, username: 'test-user', is_admin: false };
let plugin: AppPlugin;
let ready = Promise.resolve();
let observedReady = deferred<void>();
let initializationGate: ReturnType<typeof deferred<void>> | undefined;
let initializationStarted = deferred<void>();
let userRequestStarted = deferred<void>();
let queryUser: () => Promise<typeof user>;
let pluginCalls = 0;
let managerCalls = 0;
let consoleChecks = 0;
let consoleAccess: boolean | 'error' = true;
const originalErrorHandler = mock.fn(
  (_error: unknown, _options: unknown) => {}
);

const mockSource = (path: string, namedExports: Record<string, unknown>) =>
  mock.module(new URL(path, import.meta.url).href, { namedExports });

mockSource('../atoms/settings.ts', { userSettingsHelperAtom: settingsAtom });
mockSource('../atoms/user.ts', {
  GPUStackVersionAtom: versionAtom,
  UpdateCheckAtom: updateAtom,
  userAtom
});
mockSource('../atoms/utils/index.ts', {
  setAtomStorage: (atom: unknown, value: unknown) =>
    writes.push({ atom, value })
});
mock.module(
  new URL('../components/public-page-provider.tsx', import.meta.url).href,
  {
    defaultExport: () => null
  }
);
mock.module(new URL('../layouts/error-boundary.tsx', import.meta.url).href, {
  defaultExport: () => null
});
mockSource('../locales/load-messages.ts', {
  ensureCurrentLocaleMessages: async () => {}
});
mockSource('../plugins/enterprise-ready.ts', {
  enterprisePluginReady: {
    then: (resolve: () => void, reject: (error: unknown) => void) => {
      observedReady.resolve();
      return ready.then(resolve, reject);
    }
  }
});
mockSource('../plugins/manager.ts', {
  GPUStackPluginManager: {
    get: (name: string) => (name === 'enterprise' ? plugin : manager.get(name)),
    getAll: () => manager.getAll(),
    initialize: (context: AppPluginContext) => {
      managerCalls += 1;
      return manager.initialize(context);
    }
  }
});
mockSource('../request-config.tsx', {
  requestConfig: { errorConfig: { errorHandler: originalErrorHandler } }
});
mockSource('../services/profile/apis.ts', {
  queryCurrentUserState: async () => {
    requests.push('current-user');
    userRequestStarted.resolve();
    return queryUser();
  },
  queryVersionInfo: async () => {
    requests.push('version');
    return { version: '1.0.0' };
  },
  updateCheck: async () => {
    requests.push('update-check');
    return {};
  }
});
mockSource('../services/system/query-system-config.ts', {
  fetchSystemConfig: async () => {
    requests.push('system-config');
  }
});
mockSource('../utils/index.ts', { isOnline: () => false });
mockSource('../utils/access-probes.ts', {
  markInitialStateProbed: () => requests.push('mark-probed'),
  probeAccessFlags: async () => {
    requests.push('access-probes');
    return { hasKubernetesCluster: false, hasResourceEvents: false };
  }
});
mockSource('../utils/install-fetch.ts', { installTenantFetch: () => {} });
mockSource('../utils/localstore/index.ts', {
  IS_FIRST_LOGIN: 'first-login',
  readState: async () => {
    requests.push('initial-page-check');
    return true;
  },
  writeState: () => {}
});
mock.module('@gpustack/core-ui/style.css', { defaultExport: {} });
mock.module('@umijs/max', {
  namedExports: {
    history,
    request: async (path: string) => {
      requests.push(path);
      return settings;
    }
  }
});
mock.module('antd', { namedExports: { message: { error: () => {} } } });

const {
  getInitialState,
  modifyClientRenderOpts,
  request: appRequest
} = await import('../app.tsx');

beforeEach(() => {
  manager = new Manager();
  location.pathname = '/public/example';
  redirects.length = 0;
  requests.length = 0;
  writes.length = 0;
  pluginCalls = 0;
  managerCalls = 0;
  consoleChecks = 0;
  consoleAccess = true;
  originalErrorHandler.mock.resetCalls();
  ready = Promise.resolve();
  observedReady = deferred<void>();
  initializationGate = undefined;
  initializationStarted = deferred<void>();
  userRequestStarted = deferred<void>();
  queryUser = async () => user;
  plugin = {
    publicRoutes: ['/public/example'],
    canInitializeConsole: async () => {
      consoleChecks += 1;
      if (consoleAccess === 'error') throw new Error('Console unavailable');
      return consoleAccess;
    },
    onAppInit: async (context) => {
      pluginCalls += 1;
      initializationStarted.resolve();
      await initializationGate?.promise;
      const value = await context.request('/test-plugin/settings');
      context.setUserSettings?.(value);
      return { settings: value };
    }
  };
  manager.register('test-plugin', plugin);
  modifyClientRenderOpts({ basename: '/' });
});

const assertPublic = (state: Awaited<ReturnType<typeof getInitialState>>) => {
  assert.equal((state as { isPublicPage?: boolean }).isPublicPage, true);
  assert.equal(state.currentUser, undefined);
  assert.equal(typeof state.fetchUserInfo, 'function');
};

test('public cold startup performs no plugin or management initialization', async () => {
  assertPublic(await getInitialState());
  assert.equal(managerCalls, 0);
  assert.equal(pluginCalls, 0);
  assert.equal(consoleChecks, 0);
  assert.deepEqual(requests, []);
  assert.deepEqual(writes, []);
  assert.deepEqual(redirects, []);
});

for (const permission of [false, 'error'] as const) {
  test(`public entry skips the console guard while private entry respects it (${permission})`, async () => {
    consoleAccess = permission;
    assertPublic(await getInitialState());
    assert.equal(consoleChecks, 0);
    assert.deepEqual(requests, []);

    location.pathname = '/private/example';
    const state = await getInitialState();
    assert.equal(state.currentUser, user);
    assert.notEqual(state.isPublicPage, true);
    assert.equal(consoleChecks, 1);
    assert.equal(state.hasKubernetesCluster, undefined);
    assert.ok(!requests.includes('access-probes'));
    assert.ok(!requests.includes('mark-probed'));
    assert.ok(!requests.includes('initial-page-check'));
    assert.deepEqual(redirects, []);

    location.pathname = '/public/example';
    const priorRequests = [...requests];
    assertPublic(await getInitialState());
    assert.equal(consoleChecks, 1);
    assert.deepEqual(requests, priorRequests);
  });
}

test('a prefixed public cold startup preserves management initialization for private entry', async () => {
  modifyClientRenderOpts({ basename: '/console/' });
  location.pathname = '/console/public/example';
  assertPublic(await getInitialState());
  assert.equal(managerCalls, 0);
  assert.equal(pluginCalls, 0);
  assert.deepEqual(requests, []);
  assert.deepEqual(writes, []);
  assert.deepEqual(redirects, []);

  location.pathname = '/console/private/example';
  const state = await getInitialState();
  assert.notEqual((state as { isPublicPage?: boolean }).isPublicPage, true);
  assert.equal(state.currentUser, user);
  assert.deepEqual(state.pluginData, { 'test-plugin': { settings } });
  assert.equal(managerCalls, 1);
  assert.equal(pluginCalls, 1);
  for (const request of [
    '/test-plugin/settings',
    'version',
    'current-user',
    'access-probes'
  ]) {
    assert.equal(
      requests.filter((path) => path === request).length,
      1,
      request
    );
  }
  assert.ok(
    writes.some(
      (write) => write.atom === settingsAtom && write.value === settings
    )
  );
  assert.deepEqual(redirects, []);
});

for (const path of ['/login', '/private/example']) {
  test(`public startup followed by ${path} initializes plugin settings once`, async () => {
    assertPublic(await getInitialState());
    assert.equal(pluginCalls, 0);
    location.pathname = path;
    const state = await getInitialState();
    assert.notEqual((state as { isPublicPage?: boolean }).isPublicPage, true);
    assert.equal(pluginCalls, 1);
    assert.deepEqual(state.pluginData, { 'test-plugin': { settings } });
    assert.equal(
      requests.filter((request) => request === '/test-plugin/settings').length,
      1
    );
    assert.ok(
      writes.some(
        (write) => write.atom === settingsAtom && write.value === settings
      )
    );
    assert.equal(
      requests.filter((request) => request === 'current-user').length,
      path === '/login' ? 0 : 1
    );

    location.pathname = '/private/another';
    const refreshed = await getInitialState();
    assert.equal(refreshed.currentUser, user);
    assert.equal(pluginCalls, 1);
    assert.equal(
      requests.filter((request) => request === '/test-plugin/settings').length,
      1
    );
  });
}

test('a route changed during registration is classified by the current prefixed path', async () => {
  modifyClientRenderOpts({ basename: '/console/' });
  location.pathname = '/console/private/example';
  const registration = deferred<void>();
  ready = registration.promise;
  const pending = getInitialState();
  await observedReady.promise;
  location.pathname = '/console/public/example';
  registration.resolve();
  assertPublic(await pending);
  assert.equal(managerCalls, 0);
  assert.equal(pluginCalls, 0);
  assert.deepEqual(requests, []);
  assert.deepEqual(redirects, []);
});

test('returning public during plugin initialization skips subsequent host probes', async () => {
  location.pathname = '/private/example';
  initializationGate = deferred<void>();
  const pending = getInitialState();
  await initializationStarted.promise;
  location.pathname = '/public/example';
  initializationGate.resolve();
  assertPublic(await pending);
  assert.equal(pluginCalls, 1);
  assert.deepEqual(requests, ['/test-plugin/settings']);
  assert.deepEqual(redirects, []);
});

test('a late management authentication failure cannot redirect an open public route', async () => {
  location.pathname = '/private/example';
  const identity = deferred<typeof user>();
  queryUser = () => identity.promise;
  const pending = getInitialState();
  await userRequestStarted.promise;
  location.pathname = '/public/example';
  identity.reject(new Error('Session is unavailable'));
  assertPublic(await pending);
  assert.deepEqual(redirects, []);
  assert.ok(!requests.includes('mark-probed'));
  assert.ok(!requests.includes('initial-page-check'));
  assert.ok(!writes.some((write) => write.atom === userAtom));
});

test('returning public during identity loading skips subsequent capability probes', async () => {
  location.pathname = '/private/example';
  const identity = deferred<typeof user>();
  queryUser = () => identity.promise;
  const pending = getInitialState();
  await userRequestStarted.promise;
  location.pathname = '/public/example';
  identity.resolve(user);
  assertPublic(await pending);
  assert.ok(!requests.includes('access-probes'));
  assert.ok(!requests.includes('mark-probed'));
  assert.ok(!requests.includes('initial-page-check'));
  assert.deepEqual(redirects, []);
});

test('request errors on current public routes skip management error handling', () => {
  const error = new Error('An earlier management request returned 401');
  const options = { skipErrorHandler: true };
  const cases = [
    ['/', '/public/example'],
    ['/', '/PUBLIC/EXAMPLE'],
    ['/console/', '/console/public/example'],
    ['/console/', '/CONSOLE/PUBLIC/EXAMPLE']
  ];

  for (const [basename, pathname] of cases) {
    modifyClientRenderOpts({ basename });
    location.pathname = pathname;
    appRequest.errorConfig?.errorHandler?.(error, options);
    assert.equal(originalErrorHandler.mock.callCount(), 0, pathname);
  }
});

test('encoded request errors follow the framework route classification', () => {
  const error = new Error('A management request returned 401');
  const options = { skipErrorHandler: true };
  const cases = [
    ['/', '/public/%65xample'],
    ['/', '/%70ublic/%45XAMPLE'],
    ['/console/', '/console/public/%65xample'],
    ['/console/', '/console/%70ublic/%45XAMPLE']
  ];

  for (const [basename, pathname] of cases) {
    originalErrorHandler.mock.resetCalls();
    modifyClientRenderOpts({ basename });
    location.pathname = pathname;
    // Router 6.3 treats these encoded static segments as private; later
    // versions may decode them. Error handling must follow the routed page.
    const isPublic =
      runtimeRouter.matchRoutes(
        [{ path: '/public/example' }],
        pathname,
        basename.replace(/\/+$/, '').replace(/^\/*/, '/')
      ) !== null;
    appRequest.errorConfig?.errorHandler?.(error, options);
    assert.equal(
      originalErrorHandler.mock.callCount(),
      isPublic ? 0 : 1,
      pathname
    );
    if (!isPublic) {
      const [handledError, handledOptions] =
        originalErrorHandler.mock.calls[0].arguments;
      assert.equal(handledError, error, pathname);
      assert.equal(handledOptions, options, pathname);
    }
  }
});

test('private request errors delegate the original error and options unchanged', () => {
  const error = new Error('An active management request returned 401');
  const options = { skipErrorHandler: true };
  const cases = [
    ['/', '/login'],
    ['/', '/private/example'],
    ['/console/', '/console/private/example'],
    ['/console/', '/console/public/example/settings'],
    ['/console/', '/consoleevil/public/example']
  ];

  for (const [basename, pathname] of cases) {
    originalErrorHandler.mock.resetCalls();
    modifyClientRenderOpts({ basename });
    location.pathname = pathname;
    appRequest.errorConfig?.errorHandler?.(error, options);
    assert.equal(originalErrorHandler.mock.callCount(), 1, pathname);
    const [handledError, handledOptions] =
      originalErrorHandler.mock.calls[0].arguments;
    assert.equal(handledError, error, pathname);
    assert.equal(handledOptions, options, pathname);
  }
});
