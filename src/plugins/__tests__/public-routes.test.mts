import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mock, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Follow Umi's own dependency chain: the host's directly installed Router can
// differ from the version Umi aliases into both development and production.
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
const { isPluginPublicPage } = await import('../public-routes.ts');

const navigator = {
  createHref: () => '/',
  go() {},
  push() {},
  replace() {}
};
const routerRendersPublicPage = (
  pathname: string,
  basename = '/',
  publicPath = '/public/example'
) =>
  renderToStaticMarkup(
    createElement(
      runtimeRouter.Router,
      { basename, location: pathname, navigator, static: true },
      createElement(
        runtimeRouter.Routes,
        null,
        createElement(runtimeRouter.Route, {
          path: publicPath,
          element: createElement('div', { 'data-public-page': '' })
        }),
        createElement(runtimeRouter.Route, { path: '*', element: null })
      )
    )
  ).includes('data-public-page');

test('only registered exact public paths bypass management initialization', () => {
  const plugins = [
    {},
    { publicRoutes: ['/public/example', '/another/public/'] }
  ];
  assert.equal(isPluginPublicPage('/public/example', plugins), true);
  assert.equal(isPluginPublicPage('/public/example/', plugins), true);
  assert.equal(isPluginPublicPage('/another/public', plugins), true);
  assert.equal(isPluginPublicPage('/public/example/settings', plugins), false);
  assert.equal(isPluginPublicPage('/private/example', plugins), false);
  assert.equal(isPluginPublicPage('', plugins), false);
});

test('standalone OSS has no public plugin paths', () => {
  for (const pathname of ['', '/', '/public/example', '/private/example']) {
    assert.equal(isPluginPublicPage(pathname, []), false);
  }
});

test('raw history paths use the same basename normalization as Umi Router', () => {
  const plugins = [{ publicRoutes: ['/public/example'] }];
  const cases = [
    ['', '/public/example'],
    ['/', '/public/example'],
    ['/console', '/console/public/example'],
    ['/console/', '/console/public/example'],
    ['/console///', '/console/public/example'],
    ['console/', '/console/public/example'],
    ['/console/nested', '/console/nested/public/example'],
    ['/console/nested/', '/console/nested/public/example']
  ];
  for (const [basename, path] of cases) {
    for (const pathname of [path, `${path}/`]) {
      assert.equal(routerRendersPublicPage(pathname, basename), true, pathname);
      assert.equal(
        isPluginPublicPage(pathname, plugins, basename),
        true,
        `${basename}: ${pathname}`
      );
      assert.equal(isPluginPublicPage(pathname, [], basename), false);
    }
  }
});

test('empty locations and root routes follow Umi Router with root basenames', () => {
  const plugins = [{ publicRoutes: ['/'] }];
  for (const basename of ['', '/', '///']) {
    for (const pathname of ['', '/']) {
      assert.equal(routerRendersPublicPage(pathname, basename, '/'), true);
      assert.equal(isPluginPublicPage(pathname, plugins, basename), true);
    }
  }
});

test('case and URL encoding follow the framework Router version', () => {
  const plugins = [{ publicRoutes: ['/public/example'] }];
  for (const [basename, prefix] of [
    ['/', ''],
    ['/console/', '/console'],
    ['/console/nested/', '/console/nested']
  ]) {
    const uppercase = `${prefix}/PUBLIC/EXAMPLE`;
    assert.equal(routerRendersPublicPage(uppercase, basename), true);
    assert.equal(isPluginPublicPage(uppercase, plugins, basename), true);

    // Router versions differ in decoding static route segments. Compare with
    // the actual renderer rather than hard-coding a newer Router's behavior.
    for (const pathname of [
      `${prefix}/public/%65xample`,
      `${prefix}/%70ublic/%45XAMPLE/`,
      `${prefix}/public/%65xample/settings`,
      `${prefix}/public/%65xample-extra`
    ]) {
      assert.equal(
        isPluginPublicPage(pathname, plugins, basename),
        routerRendersPublicPage(pathname, basename),
        pathname
      );
      assert.equal(isPluginPublicPage(pathname, [], basename), false);
    }
  }
});

test('basename matching preserves segment boundaries and rejects unrelated paths', () => {
  const plugins = [{ publicRoutes: ['/public/example'] }];
  for (const basename of ['/console', '/console/']) {
    for (const pathname of [
      '/consoleevil/public/example',
      '/other/public/example',
      '/public/example',
      '/console/public/example/settings',
      '/consoleevil/PUBLIC/EXAMPLE',
      '/other/public/%65xample',
      '/%63onsole/public/example'
    ]) {
      assert.equal(isPluginPublicPage(pathname, plugins, basename), false);
    }
    assert.equal(
      isPluginPublicPage('/CONSOLE/public/example', plugins, basename),
      true
    );
  }
});
