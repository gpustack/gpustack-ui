import * as jotai from 'jotai';
import { atom, getDefaultStore } from 'jotai';
import assert from 'node:assert/strict';
import { after, beforeEach, mock, test } from 'node:test';
import { act, createElement, Fragment } from 'react';
import { createRoot } from 'react-dom/client';
import { createTestDOM } from './test-dom.mts';

// Keep the ESM test and tsx's CJS consumers on the same real Jotai store.
mock.module('jotai', { namedExports: { ...jotai } });
const dom = createTestDOM();
after(() => dom.window.close());
let dark = false;
let plugin: any;
const preferences = { colorPrimary: '#123456' };
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      locale: 'en-US',
      formatMessage: ({ id }: any) =>
        id === 'settings.company' ? 'GPUStack' : id
    }),
    useModel: () => ({}),
    history: { replace() {} }
  }
});
mock.module('antd-style', {
  namedExports: { createStyles: () => () => ({ styles: {} }) }
});
mock.module(
  new URL('../../../assets/images/gpustack-logo.png', import.meta.url).href,
  { defaultExport: '/built-in-logo.png' }
);
mock.module(
  new URL('../../../assets/images/small-logo-200x200.png', import.meta.url)
    .href,
  { defaultExport: '/built-in-mini.png' }
);
mock.module(
  new URL('../../../hooks/use-user-settings.ts', import.meta.url).href,
  {
    defaultExport: () => ({ isDarkTheme: dark, userSettings: preferences })
  }
);
mock.module(new URL('../../../plugins/index.ts', import.meta.url).href, {
  namedExports: { getGPUStackPlugin: () => plugin }
});
mock.module(new URL('../../../atoms/user.ts', import.meta.url).href, {
  namedExports: {
    userAtom: atom(null),
    GPUStackVersionAtom: atom({ version: 'test' })
  }
});
mock.module(
  new URL('../../../components/version-info/index.tsx', import.meta.url).href,
  {
    defaultExport: { __esModule: true, default: () => null, modalConfig: {} }
  }
);
mock.module(new URL('../../../utils/documentation.ts', import.meta.url).href, {
  namedExports: { getDocumentationUrl: () => '/help/' }
});
mock.module(
  new URL('../../login/hooks/use-local-auth.ts', import.meta.url).href,
  {
    namedExports: {
      useLocalAuth: () => ({ handleLogin() {}, submitLoading: false })
    }
  }
);
mock.module(
  new URL('../../login/hooks/use-sso-auth.ts', import.meta.url).href,
  { namedExports: { useSSOAuth: () => ({ options: {} }) } }
);
mock.module(new URL('../../login/utils.ts', import.meta.url).href, {
  namedExports: { checkDefaultPage() {} }
});
mock.module(
  new URL('../../login/components/local-user-form.tsx', import.meta.url).href,
  { defaultExport: () => null }
);
const { defaultSiteSettings } = await import('../config');
const { siteSettingsAtom } = await import('../../../atoms/site-settings');
const { LogoIcon, SLogoIcon } = await import('../../../layouts/Logo');
const { default: Footer } = await import('../../../components/footer');
const { default: LoginForm } =
  await import('../../login/components/login-form');
const store = getDefaultStore();
beforeEach(() => {
  dark = false;
  plugin = undefined;
  store.set(siteSettingsAtom, defaultSiteSettings);
});

async function mount() {
  const container = document.getElementById('root')!;
  const root = createRoot(container);
  const render = () =>
    act(async () => {
      root.render(
        createElement(
          Fragment,
          null,
          createElement(
            'div',
            { 'data-sidebar': true },
            createElement(LogoIcon),
            createElement(SLogoIcon)
          ),
          createElement(
            'div',
            { 'data-login': true },
            createElement(LoginForm)
          ),
          createElement(Footer)
        )
      );
    });
  await render();
  return { container, render, unmount: () => act(async () => root.unmount()) };
}

test('saved settings update existing login, sidebar and footer consumers without remounting', async () => {
  const ui = await mount();
  try {
    assert.equal(
      ui.container
        .querySelector<HTMLImageElement>('[data-sidebar] img')
        ?.getAttribute('src'),
      '/built-in-logo.png'
    );
    assert.ok(
      ui.container
        .querySelector('[data-sidebar] img')
        ?.classList.contains('sider-brand-logo-padded')
    );
    await act(async () =>
      store.set(siteSettingsAtom, {
        ...defaultSiteSettings,
        site_name: 'Research Lab',
        logo: '/light.png',
        logo_dark: '/dark.png',
        mini_logo: '/mini.png',
        mini_logo_dark: '/mini-dark.png',
        footer_name: 'Lab Inc.',
        footer_url: '/about'
      })
    );
    const images = [...ui.container.querySelectorAll<HTMLImageElement>('img')];
    assert.deepEqual(
      images.map((img) => img.getAttribute('src')),
      ['/light.png', '/mini.png', '/light.png']
    );
    assert.ok(images.every((img) => img.alt === 'Research Lab'));
    assert.equal(
      images[0].classList.contains('sider-brand-logo-padded'),
      false
    );
    const company = [...ui.container.querySelectorAll('a')].find(
      (link) => link.textContent === 'Lab Inc.'
    )!;
    assert.equal(company.getAttribute('href'), '/about');
    assert.equal(company.rel, 'noopener noreferrer');
    dark = true;
    await ui.render();
    assert.deepEqual(
      [...ui.container.querySelectorAll('img')].map((img) =>
        img.getAttribute('src')
      ),
      ['/dark.png', '/mini-dark.png', '/dark.png']
    );
    await act(async () => store.set(siteSettingsAtom, defaultSiteSettings));
    assert.equal(
      ui.container.querySelector('[data-sidebar] img')?.getAttribute('src'),
      '/built-in-logo.png'
    );
    assert.ok(
      [...ui.container.querySelectorAll('a')].some(
        (a) =>
          a.textContent === 'GPUStack' &&
          a.getAttribute('href') === 'https://gpustack.ai'
      )
    );
  } finally {
    await ui.unmount();
  }
});

test('custom site names without images are visible text and remain escaped', async () => {
  const name = '<script>alert(1)</script>';
  store.set(siteSettingsAtom, { ...defaultSiteSettings, site_name: name });
  const ui = await mount();
  try {
    const login = ui.container.querySelector('[data-login]')!;
    assert.ok(login.textContent?.includes(name));
    assert.equal(login.querySelector('img'), null);
    assert.equal(login.querySelector('script'), null);
  } finally {
    await ui.unmount();
  }
});

test('enterprise logos take precedence and missing plugin assets fall back independently', async () => {
  store.set(siteSettingsAtom, {
    ...defaultSiteSettings,
    logo: '/site.png',
    mini_logo: '/site-mini.png'
  });
  const calls: any[] = [];
  plugin = {
    branding: {
      resolveLogos: (settings: any, theme: boolean) => {
        calls.push([settings, theme]);
        return { sidebarLogo: '/enterprise.png' };
      }
    }
  };
  dark = true;
  const ui = await mount();
  try {
    assert.deepEqual(
      [...ui.container.querySelectorAll('[data-sidebar] img')].map((img) =>
        img.getAttribute('src')
      ),
      ['/enterprise.png', '/site-mini.png']
    );
    assert.ok(
      calls.every(
        ([settings, theme]) => settings === preferences && theme === true
      )
    );
  } finally {
    await ui.unmount();
  }
});

test('untrusted footer URLs never become executable or protocol-relative links', async () => {
  const ui = await mount();
  try {
    for (const url of [
      'javascript:alert(1)',
      'data:text/html,hello',
      '//outside.test',
      '/\\outside.test'
    ]) {
      await act(async () =>
        store.set(siteSettingsAtom, {
          ...defaultSiteSettings,
          footer_name: 'Lab Inc.',
          footer_url: url
        })
      );
      const company = [...ui.container.querySelectorAll('a')].find(
        (a) => a.textContent === 'Lab Inc.'
      )!;
      assert.equal(company.getAttribute('href'), 'https://gpustack.ai');
    }
  } finally {
    await ui.unmount();
  }
});
