import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, mock, test } from 'node:test';
import { pathToFileURL } from 'node:url';
import {
  act,
  createContext,
  createElement,
  StrictMode,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction
} from 'react';
import { createRoot } from 'react-dom/client';
import ts from 'typescript';

const dom = new JSDOM('<div id="root"></div>', {
  url: 'https://gpustack.example/console/'
});
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
dom.window.matchMedia = () =>
  ({
    matches: false,
    addEventListener() {},
    removeEventListener() {}
  }) as MediaQueryList;
after(() => dom.window.close());

const listeners = new Set<() => void>();
const location = {
  pathname: '/console/private/example',
  hash: ''
};
const history = {
  location,
  listen: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  push: mock.fn(),
  replace: mock.fn(),
  go: mock.fn()
};
let intl = { locale: 'zh-CN', formatMessage: ({ id }: { id: string }) => id };
let userSettings = { theme: 'light', isDarkTheme: false };
const useIntl = mock.fn(() => intl);
let loadLocale = async (_locale: string): Promise<boolean> => true;
const ensureLocaleMessages = mock.fn((locale: string) => loadLocale(locale));
const setLocale = mock.fn();
mock.module(new URL('../../locales/load-messages.ts', import.meta.url).href, {
  namedExports: { ensureLocaleMessages }
});
type InitialState = {
  isPublicPage?: boolean;
  fetchUserInfo?: () => Promise<unknown>;
};
type InitialStateModel = {
  initialState: InitialState;
  loading: boolean;
  error: unknown;
};

// Run the same Dispatcher/Executor/useModel code that Umi emits, including its
// effect-delayed notifications. A direct Context mock skips that delay and can
// hide a second refresh between the request settling and model publication.
const require = createRequire(import.meta.url);
const maxRequire = createRequire(require.resolve('@umijs/max/package.json'));
const frameworkRoot = dirname(
  maxRequire.resolve('@umijs/plugins/package.json')
);
const frameworkRequire = createRequire(join(frameworkRoot, 'package.json'));
const fixtureDirectory = mkdtempSync(
  join(tmpdir(), 'gpustack-public-provider-')
);
after(() => rmSync(fixtureDirectory, { recursive: true, force: true }));
const frameworkSource = readFileSync(
  join(frameworkRoot, 'libs/model.tsx'),
  'utf8'
)
  .replace(
    "'react'",
    JSON.stringify(pathToFileURL(require.resolve('react')).href)
  )
  .replace(
    "'fast-deep-equal'",
    JSON.stringify(
      pathToFileURL(frameworkRequire.resolve('fast-deep-equal')).href
    )
  );
const fixtureFile = join(fixtureDirectory, 'model.mjs');
writeFileSync(
  fixtureFile,
  ts.transpileModule(frameworkSource, {
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true
    },
    fileName: 'model.tsx'
  }).outputText
);
const { Provider: FrameworkModelProvider, useModel: useFrameworkModel } =
  await import(pathToFileURL(fixtureFile).href);
let observedInitialState: InitialStateModel | undefined;

const withFreshFetcher = (initialState: InitialState): InitialState => ({
  ...initialState,
  // getInitialState creates this function on every result, including repeated
  // public results. Preserve that identity change through Umi's deep equality.
  fetchUserInfo: async () => ({})
});

const createInitialStateHarness = (initialState: InitialState = {}) => {
  const requests: {
    resolve: (result: InitialState) => void;
    reject: (error: Error) => void;
  }[] = [];
  let updateModel: Dispatch<SetStateAction<InitialStateModel>>;
  let activeRequests = 0;
  let maxActiveRequests = 0;
  // Match Umi: refresh commits its result into the model, and catches errors
  // into model.error rather than rejecting its returned promise.
  const refresh = mock.fn(async () => {
    activeRequests += 1;
    maxActiveRequests = Math.max(maxActiveRequests, activeRequests);
    updateModel((state) => ({ ...state, loading: true, error: undefined }));
    try {
      const result = await new Promise<InitialState>((resolve, reject) => {
        requests.push({ resolve, reject });
      });
      updateModel({
        initialState: withFreshFetcher(result),
        loading: false,
        error: undefined
      });
    } catch (error) {
      updateModel((state) => ({ ...state, loading: false, error }));
    } finally {
      activeRequests -= 1;
    }
  });
  const useInitialStateModel = () => {
    const [state, setState] = useState<InitialStateModel>({
      initialState: withFreshFetcher(initialState),
      loading: false,
      error: undefined
    });
    updateModel = setState;
    return { ...state, refresh };
  };
  const models = { '@@initialState': useInitialStateModel };
  const Harness = ({ children }: PropsWithChildren) =>
    createElement(FrameworkModelProvider, { models }, children);
  return {
    Harness,
    requests,
    refresh,
    get activeRequests() {
      return activeRequests;
    },
    get maxActiveRequests() {
      return maxActiveRequests;
    }
  };
};
type TestCoreUIContext = {
  config: { theme: string; isDarkTheme: boolean };
  i18n: typeof intl;
  hooks: { useCurrentUser: () => unknown };
  locale: { setLocale: (locale: string, reload?: boolean) => Promise<void> };
};
const TestCoreUIContext = createContext<TestCoreUIContext | undefined>(
  undefined
);
let providerRenders = 0;
let publicContext: TestCoreUIContext;
const passChildren = ({ children }: PropsWithChildren) => children;
mock.module(new URL('../../hooks/use-user-settings.ts', import.meta.url).href, {
  defaultExport: () => ({
    userSettings,
    themeData: {},
    setTheme: () => {}
  })
});
mock.module(
  new URL('../../hooks/use-user-settings-storage.ts', import.meta.url).href,
  { defaultExport: () => ({}) }
);
mock.module('@umijs/max', {
  namedExports: {
    history,
    getAllLocales: () => ['zh-CN'],
    setLocale,
    useIntl,
    useModel: () => {
      const state = useFrameworkModel('@@initialState') as InitialStateModel & {
        refresh: () => Promise<void>;
      };
      observedInitialState = state;
      return state;
    }
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    CoreUIProvider: ({
      children,
      ...context
    }: PropsWithChildren<TestCoreUIContext>) => {
      providerRenders += 1;
      publicContext = context;
      return createElement(
        TestCoreUIContext.Provider,
        { value: context },
        createElement('section', { 'data-public-context': '' }, children)
      );
    }
  }
});
mock.module('antd', {
  namedExports: {
    App: passChildren,
    ConfigProvider: passChildren,
    theme: { darkAlgorithm: () => {}, defaultAlgorithm: () => {} }
  }
});
mock.module(new URL('../../utils/asset-recovery.ts', import.meta.url).href, {
  namedExports: { cleanupBustParam: () => {}, recoverStaleAssets: () => false }
});
mock.module(new URL('../../layouts/error-result.tsx', import.meta.url).href, {
  defaultExport: {
    __esModule: true,
    default: ({ extra }: { extra: string }) =>
      createElement('div', { 'data-error': '' }, extra),
    isChunkLoadError: () => false
  }
});

const { GPUStackPluginManager } = await import('../../plugins/manager.ts');
const { default: PublicPageProvider } =
  await import('../public-page-provider.tsx');
const { default: ErrorBoundary } =
  await import('../../layouts/error-boundary.tsx');

const navigate = async (pathname: string, hash = '') => {
  await act(async () => {
    location.pathname = pathname;
    location.hash = hash;
    listeners.forEach((listener) => listener());
  });
};

const resetEnvironment = (pathname = '/console/private/example') => {
  assert.equal(listeners.size, 0);
  GPUStackPluginManager.getAll().clear();
  GPUStackPluginManager.register('test-plugin', {
    publicRoutes: ['/public/example']
  });
  location.pathname = pathname;
  location.hash = '';
  userSettings = { theme: 'light', isDarkTheme: false };
  intl = { ...intl, locale: 'zh-CN' };
  useIntl.mock.resetCalls();
  ensureLocaleMessages.mock.resetCalls();
  setLocale.mock.resetCalls();
  loadLocale = async () => true;
};

test('public context follows pathname while private pages and standalone OSS retain their providers', async () => {
  resetEnvironment();
  const model = createInitialStateHarness();
  const lifecycle = { mounts: 0, cleanups: 0 };
  const Page = () => {
    const context = useContext(TestCoreUIContext);
    const [count, setCount] = useState(0);
    useEffect(() => {
      lifecycle.mounts += 1;
      return () => {
        lifecycle.cleanups += 1;
      };
    }, []);
    return createElement(
      'button',
      { 'data-content': '', onClick: () => setCount((value) => value + 1) },
      `${context?.config.theme ?? 'private'}:${context?.i18n.locale ?? 'none'}:${count}`
    );
  };
  const root = createRoot(document.getElementById('root')!);
  const render = () =>
    root.render(
      createElement(
        model.Harness,
        null,
        createElement(
          PublicPageProvider,
          { basename: '/console/' },
          createElement(Page)
        )
      )
    );

  try {
    await act(async () => render());
    assert.equal(document.querySelector('[data-public-context]'), null);
    assert.equal(useIntl.mock.calls.length, 0);
    assert.deepEqual(lifecycle, { mounts: 1, cleanups: 0 });
    const privatePage = document.querySelector('[data-content]')!;
    await act(async () => {
      privatePage.dispatchEvent(
        new dom.window.MouseEvent('click', { bubbles: true })
      );
    });
    await navigate('/console/private/another');
    await act(async () => render());
    assert.equal(document.querySelector('[data-content]'), privatePage);
    assert.equal(privatePage.textContent, 'private:none:1');
    assert.deepEqual(lifecycle, { mounts: 1, cleanups: 0 });
    assert.equal(document.querySelector('[data-public-context]'), null);
    assert.equal(useIntl.mock.calls.length, 0);

    await navigate('/console/public/example', '#token=test-token');
    assert.ok(document.querySelector('[data-public-context]'));
    assert.equal(publicContext.hooks.useCurrentUser(), undefined);
    assert.equal(publicContext.i18n, intl);
    const publicPage = document.querySelector('[data-content]')!;
    assert.equal(publicPage.textContent, 'light:zh-CN:0');
    await act(async () => {
      publicPage.dispatchEvent(
        new dom.window.MouseEvent('click', { bubbles: true })
      );
    });
    const publicLifecycle = { ...lifecycle };
    userSettings = { theme: 'realDark', isDarkTheme: true };
    intl = { ...intl, locale: 'en-US' };
    await act(async () => render());
    assert.equal(document.querySelector('[data-content]'), publicPage);
    assert.equal(publicPage.textContent, 'realDark:en-US:1');
    assert.deepEqual(lifecycle, publicLifecycle);
    const count = providerRenders;
    await navigate('/console/public/example', '#token=another-test-token');
    assert.equal(providerRenders, count);
    assert.equal(document.querySelector('[data-content]'), publicPage);
    assert.deepEqual(lifecycle, publicLifecycle);

    await navigate('/console/private/example');
    assert.equal(document.querySelector('[data-public-context]'), null);
    const privateLifecycle = { ...lifecycle };
    await navigate('/consoleevil/public/example');
    assert.equal(document.querySelector('[data-public-context]'), null);
    assert.deepEqual(lifecycle, privateLifecycle);

    GPUStackPluginManager.getAll().clear();
    await navigate('/console/public/example');
    assert.equal(document.querySelector('[data-public-context]'), null);
    assert.deepEqual(lifecycle, privateLifecycle);
  } finally {
    await act(async () => root.unmount());
    GPUStackPluginManager.getAll().clear();
  }
  assert.equal(listeners.size, 0);
  assert.equal(lifecycle.mounts, lifecycle.cleanups);
  assert.equal(model.refresh.mock.calls.length, 0);
});

test('a public boot defers management mounting until refresh commits once', async () => {
  resetEnvironment('/console/public/example');
  const model = createInitialStateHarness({ isPublicPage: true });
  const lifecycle = { privateMounts: 0 };
  const Page = () => {
    const isPublic = !!useContext(TestCoreUIContext);
    useEffect(() => {
      if (!isPublic) lifecycle.privateMounts += 1;
    }, []);
    return createElement(
      'div',
      { 'data-content': '' },
      isPublic ? 'Public' : 'Private'
    );
  };
  const root = createRoot(document.getElementById('root')!);
  const render = () =>
    root.render(
      createElement(
        model.Harness,
        null,
        createElement(
          PublicPageProvider,
          { basename: '/console/' },
          createElement(Page)
        )
      )
    );
  try {
    await act(async () => render());
    assert.equal(
      document.querySelector('[data-content]')?.textContent,
      'Public'
    );
    assert.equal(model.refresh.mock.calls.length, 0);
    await navigate('/console/private/example');
    assert.equal(document.querySelector('[data-content]'), null);
    assert.equal(lifecycle.privateMounts, 0);
    assert.equal(model.requests.length, 1);
    await navigate('/console/private/another');
    assert.equal(document.querySelector('[data-content]'), null);
    assert.equal(model.requests.length, 1);
    await act(async () => {
      model.requests[0].resolve({});
      await model.refresh.mock.calls[0].result;
      // The promise is done, but the framework hasn't published its result to
      // this consumer yet. Keep management blocked and avoid another refresh.
      assert.equal(observedInitialState?.initialState.isPublicPage, true);
      assert.equal(document.querySelector('[data-content]'), null);
      assert.equal(model.refresh.mock.calls.length, 1);
    });
    assert.equal(
      document.querySelector('[data-content]')?.textContent,
      'Private'
    );
    assert.equal(lifecycle.privateMounts, 1);
    assert.equal(model.refresh.mock.calls.length, 1);
    assert.equal(model.activeRequests, 0);
    await navigate('/console/private/example');
    await navigate('/console/public/example', '#token=test-token');
    userSettings = { theme: 'realDark', isDarkTheme: true };
    intl = { ...intl, locale: 'en-US' };
    await act(async () => render());
    await navigate('/console/public/example', '#token=another-test-token');
    await navigate('/console/private/example');
    assert.equal(
      document.querySelector('[data-content]')?.textContent,
      'Private'
    );
    assert.equal(model.refresh.mock.calls.length, 1);
  } finally {
    await act(async () => root.unmount());
    GPUStackPluginManager.getAll().clear();
  }
  assert.equal(listeners.size, 0);
});

test('Strict Mode and repeated navigation share one initialization until each result commits', async () => {
  resetEnvironment('/console/private/example');
  const model = createInitialStateHarness({ isPublicPage: true });
  const root = createRoot(document.getElementById('root')!);
  try {
    await act(async () => {
      root.render(
        createElement(
          StrictMode,
          null,
          createElement(
            model.Harness,
            null,
            createElement(
              PublicPageProvider,
              { basename: '/console/' },
              createElement('div', { 'data-content': '' }, 'Page')
            )
          )
        )
      );
    });
    assert.equal(model.requests.length, 1);
    assert.equal(document.querySelector('[data-content]'), null);
    await navigate('/console/public/example');
    assert.ok(document.querySelector('[data-public-context]'));
    await navigate('/console/private/example');
    assert.equal(document.querySelector('[data-content]'), null);
    assert.equal(model.requests.length, 1);
    // The first initializer observed a return to a public route. Its result
    // must not release management children or leave the next visit blocked.
    await act(async () => model.requests[0].resolve({ isPublicPage: true }));
    assert.equal(document.querySelector('[data-content]'), null);
    assert.equal(model.requests.length, 2);
    assert.equal(model.maxActiveRequests, 1);
    await act(async () => model.requests[1].resolve({}));
    assert.ok(document.querySelector('[data-content]'));
    assert.equal(document.querySelector('[data-public-context]'), null);
    assert.equal(model.activeRequests, 0);
    assert.equal(model.refresh.mock.calls.length, 2);
  } finally {
    await act(async () => root.unmount());
    GPUStackPluginManager.getAll().clear();
  }
  assert.equal(listeners.size, 0);
});

test('results published after a quick return to a public page do not start another refresh there', async () => {
  resetEnvironment('/console/public/example');
  const model = createInitialStateHarness({ isPublicPage: true });
  const root = createRoot(document.getElementById('root')!);
  try {
    await act(async () => {
      root.render(
        createElement(
          model.Harness,
          null,
          createElement(
            PublicPageProvider,
            { basename: '/console/' },
            createElement('div', { 'data-content': '' }, 'Page')
          )
        )
      );
    });
    await navigate('/console/private/example');
    assert.equal(model.requests.length, 1);
    await navigate('/console/public/example');
    await act(async () => model.requests[0].resolve({ isPublicPage: true }));
    assert.ok(document.querySelector('[data-public-context]'));
    assert.equal(model.requests.length, 1);
    assert.equal(model.activeRequests, 0);

    await navigate('/console/private/example');
    assert.equal(model.requests.length, 2);
    assert.equal(document.querySelector('[data-content]'), null);
    await navigate('/console/public/example');
    await act(async () => model.requests[1].resolve({}));
    assert.ok(document.querySelector('[data-public-context]'));
    assert.equal(model.requests.length, 2);
    assert.equal(model.activeRequests, 0);

    await navigate('/console/private/example');
    assert.equal(document.querySelector('[data-public-context]'), null);
    assert.ok(document.querySelector('[data-content]'));
    assert.equal(model.refresh.mock.calls.length, 2);
    assert.equal(model.maxActiveRequests, 1);
  } finally {
    await act(async () => root.unmount());
    GPUStackPluginManager.getAll().clear();
  }
  assert.equal(listeners.size, 0);
});

test('a failed management refresh leaves public pages usable and reaches the existing boundary on private entry', async () => {
  resetEnvironment('/console/public/example');
  const model = createInitialStateHarness({ isPublicPage: true });
  const root = createRoot(document.getElementById('root')!);
  const consoleError = mock.method(console, 'error', () => {});
  const consoleLog = mock.method(console, 'log', () => {});
  try {
    await act(async () => {
      root.render(
        createElement(
          ErrorBoundary,
          null,
          createElement(
            model.Harness,
            null,
            createElement(
              PublicPageProvider,
              { basename: '/console/' },
              createElement('div', { 'data-content': '' }, 'Page')
            )
          )
        )
      );
    });
    await navigate('/console/private/example');
    assert.equal(document.querySelector('[data-content]'), null);
    assert.equal(model.requests.length, 1);
    await navigate('/console/public/example');
    await act(async () =>
      model.requests[0].reject(new Error('Initialization failed'))
    );
    assert.ok(document.querySelector('[data-public-context]'));
    assert.ok(document.querySelector('[data-content]'));
    assert.equal(document.querySelector('[data-error]'), null);
    assert.equal(model.activeRequests, 0);
    await navigate('/console/private/example');
    assert.equal(document.querySelector('[data-content]'), null);
    assert.equal(
      document.querySelector('[data-error]')?.textContent,
      'Initialization failed'
    );
    assert.equal(model.refresh.mock.calls.length, 1);
  } finally {
    await act(async () => root.unmount());
    GPUStackPluginManager.getAll().clear();
    consoleError.mock.restore();
    consoleLog.mock.restore();
  }
  assert.equal(listeners.size, 0);
});

test('public language changes wait for lazy messages and preserve the mounted page and management isolation', async () => {
  resetEnvironment('/console/public/example');
  const model = createInitialStateHarness({ isPublicPage: true });
  let mounts = 0;
  const Page = () => {
    useEffect(() => {
      ++mounts;
    }, []);
    return createElement('div', { 'data-locale-content': '' }, intl.locale);
  };
  const root = createRoot(document.getElementById('root')!);
  const render = () =>
    root.render(
      createElement(
        model.Harness,
        null,
        createElement(
          PublicPageProvider,
          { basename: '/console/' },
          createElement(Page)
        )
      )
    );
  try {
    await act(async () => render());
    const page = document.querySelector('[data-locale-content]');
    assert.equal(ensureLocaleMessages.mock.callCount(), 0);
    let finish!: (ready: boolean) => void;
    loadLocale = () =>
      new Promise((resolve) => {
        finish = resolve;
      });
    const switching = publicContext.locale.setLocale('ja-JP', false);
    assert.deepEqual(ensureLocaleMessages.mock.calls[0].arguments, ['ja-JP']);
    assert.equal(setLocale.mock.callCount(), 0);
    finish(true);
    await switching;
    assert.deepEqual(setLocale.mock.calls[0].arguments, ['ja-JP', false]);
    intl = { ...intl, locale: 'ja-JP' };
    await act(async () => render());
    assert.equal(document.querySelector('[data-locale-content]'), page);
    assert.equal(page?.textContent, 'ja-JP');
    assert.equal(mounts, 1);
    assert.equal(model.refresh.mock.callCount(), 0);
    assert.equal(publicContext.hooks.useCurrentUser(), undefined);

    loadLocale = async () => false;
    await assert.rejects(
      publicContext.locale.setLocale('ru-RU', false),
      /Locale messages unavailable/
    );
    assert.equal(setLocale.mock.callCount(), 1);
    assert.equal(page?.textContent, 'ja-JP');
    assert.equal(mounts, 1);
    assert.equal(model.refresh.mock.callCount(), 0);
  } finally {
    await act(async () => root.unmount());
    GPUStackPluginManager.getAll().clear();
  }
});
