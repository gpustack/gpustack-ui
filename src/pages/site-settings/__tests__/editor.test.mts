import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { after, beforeEach, mock, test } from 'node:test';
import { act, createElement, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

import {
  ControlledFileReader,
  createTestDOM,
  flushEvents
} from './test-dom.mts';
const dom = createTestDOM();
Object.assign(globalThis, { FileReader: ControlledFileReader });
after(() => dom.window.close());
// Match ahooks' CJS helpers under the Node test runner's import condition.
const hostRequire = createRequire(import.meta.url);
const requireAhooks = createRequire(hostRequire.resolve('ahooks'));
const tslib = requireAhooks('tslib/tslib.js');
mock.module(requireAhooks.resolve('tslib'), {
  namedExports: tslib,
  defaultExport: tslib
});
// Use the installed submit lock rather than reproducing its locking behavior.
const { default: useSubmitLock } = await import(
  new URL(
    './lib/hooks/use-submit-lock.es.js',
    import.meta.resolve('@gpustack/core-ui')
  ).href
);
const { defaultSiteSettings } = await import('../config');
const saved: any[] = [];
let rejectRead!: (error: Error) => void;
let reads = 0;
let failFirstRead = false;
let saveRequest = async (values: any) => ({
  ...values,
  updated_at: '2026-11-02T00:00:00Z'
});
beforeEach(() => {
  reads = 0;
  saved.length = 0;
  applied.length = 0;
  failFirstRead = false;
  ControlledFileReader.instances = [];
  saveRequest = async (values: any) => ({
    ...values,
    updated_at: '2026-11-02T00:00:00Z'
  });
});
const persisted = {
  ...defaultSiteSettings,
  site_name: 'Lab',
  primary_color: '#123456',
  logo: 'data:image/png;base64,iVBORw0KGgo=',
  footer_name: 'Lab Inc.'
};
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: { id: string }) => id })
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    useCoreUIContext: () => ({
      services: {
        request: async (url: string, options: any) => {
          assert.equal(url, '/site-settings');
          if (options.method === 'GET') {
            reads += 1;
            if (reads === 1 && failFirstRead)
              return new Promise((_resolve, reject) => {
                rejectRead = reject;
              });
            return persisted;
          }
          saved.push(options.data);
          return saveRequest(options.data);
        }
      }
    }),
    useSubmitLock
  }
});
mock.module(new URL('../../_components/page-box.tsx', import.meta.url).href, {
  defaultExport: ({ children }: { children: ReactNode }) => children
});
mock.module(new URL('../styles.module.less', import.meta.url).href, {
  defaultExport: {}
});
const applied: any[] = [];
mock.module(new URL('../bootstrap.ts', import.meta.url).href, {
  namedExports: { applySiteSettings: (settings: any) => applied.push(settings) }
});
const { default: SiteSettingsPage } = await import('../index');

test('load failure blocks writes; retry restores persisted fields and clearing an asset is saved', async () => {
  failFirstRead = true;
  const container = document.getElementById('root')!;
  const root = createRoot(container);
  const button = (text: string) =>
    [...container.querySelectorAll('button')].find(
      (element) => element.textContent === text
    )!;
  const submit = () =>
    act(async () => {
      container
        .querySelector('form')!
        .dispatchEvent(
          new dom.window.Event('submit', { bubbles: true, cancelable: true })
        );
      await new Promise<void>((resolve) => setImmediate(resolve));
    });
  try {
    await act(async () => {
      root.render(createElement(SiteSettingsPage));
    });
    assert.equal(button('siteSettings.save').disabled, true);
    await submit();
    assert.equal(saved.length, 0);
    await act(async () => {
      rejectRead(new Error('offline'));
    });
    assert.equal(button('siteSettings.save').disabled, true);
    await submit();
    assert.equal(saved.length, 0);
    await act(async () => {
      button('siteSettings.retry').click();
    });
    assert.equal(reads, 2);
    assert.equal(button('siteSettings.save').disabled, false);
    assert.equal(
      container.querySelector<HTMLInputElement>('#site_name')?.value,
      'Lab'
    );
    await act(async () => {
      button('siteSettings.clear').click();
    });
    await act(async () => {
      button('siteSettings.save').click();
      await new Promise<void>((resolve) => setImmediate(resolve));
    });
    assert.equal(saved.length, 1);
    assert.equal(saved[0].site_name, 'Lab');
    assert.equal(saved[0].footer_name, 'Lab Inc.');
    assert.equal(saved[0].logo, null);
    assert.equal('updated_at' in saved[0], false);
    assert.equal(applied.length, 1);
  } finally {
    await act(async () => root.unmount());
  }
});

async function mountEditor() {
  const container = document.getElementById('root')!;
  const root = createRoot(container);
  await act(async () => {
    root.render(createElement(SiteSettingsPage));
    await flushEvents();
  });
  const button = (text: string) =>
    [...container.querySelectorAll('button')].find(
      (b) => b.textContent === text
    )!;
  return {
    container,
    button,
    save: () =>
      act(async () => {
        button('siteSettings.save').click();
        await flushEvents();
      }),
    submit: () =>
      act(async () => {
        container
          .querySelector('form')!
          .dispatchEvent(
            new dom.window.Event('submit', { bubbles: true, cancelable: true })
          );
        await flushEvents();
      }),
    unmount: () => act(async () => root.unmount())
  };
}

test('save failure preserves edits, does not apply branding, and allows retry', async () => {
  const ui = await mountEditor();
  try {
    await act(async () => {
      ui.button('siteSettings.resetDefault').click();
    });
    assert.equal(
      ui.container
        .querySelector<HTMLInputElement>('#primary_color')
        ?.value.toUpperCase(),
      defaultSiteSettings.primary_color
    );
    assert.equal(ui.button('siteSettings.resetDefault').disabled, true);
    saveRequest = async () => {
      throw new Error('save failed');
    };
    await ui.save();
    assert.equal(saved.length, 1);
    assert.equal(applied.length, 0);
    assert.ok(document.body.textContent?.includes('siteSettings.saveError'));
    assert.equal(ui.button('siteSettings.save').disabled, false);
    assert.equal(
      ui.container.querySelector<HTMLInputElement>('#site_name')?.value,
      'Lab'
    );
    saveRequest = async (values) => ({
      ...values,
      site_name: 'Server-normalized name',
      updated_at: null
    });
    await ui.save();
    assert.equal(saved.length, 2);
    assert.equal(saved[1].primary_color, defaultSiteSettings.primary_color);
    assert.equal(applied[0].site_name, 'Server-normalized name');
  } finally {
    await ui.unmount();
  }
});

test('rapid repeated saves issue only one request and lock fields until it settles', async () => {
  let resolveSave!: (value: any) => void;
  saveRequest = () =>
    new Promise((resolve) => {
      resolveSave = resolve;
    });
  const ui = await mountEditor();
  try {
    await act(async () => {
      ui.button('siteSettings.save').click();
      ui.button('siteSettings.save').click();
      await flushEvents();
    });
    assert.equal(saved.length, 1);
    assert.equal(
      ui.container.querySelector<HTMLInputElement>('#site_name')!.disabled,
      true
    );
    assert.equal(
      ui.container.querySelector<HTMLInputElement>('input[type="file"]')!
        .disabled,
      true
    );
    await act(async () => {
      resolveSave(persisted);
      await flushEvents();
    });
    assert.equal(applied.length, 1);
    assert.equal(
      ui.container.querySelector<HTMLInputElement>('#site_name')!.disabled,
      false
    );
  } finally {
    await ui.unmount();
  }
});

test('all pending image reads block saving and the final payload includes their results', async () => {
  const ui = await mountEditor();
  try {
    await act(async () => {
      for (const input of [
        ...ui.container.querySelectorAll<HTMLInputElement>('input[type="file"]')
      ].slice(0, 2)) {
        const file = new dom.window.File(['bytes'], 'logo.png', {
          type: 'image/png'
        });
        Object.defineProperty(input, 'files', {
          configurable: true,
          value: [file]
        });
        input.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
      }
      await flushEvents();
    });
    assert.equal(ControlledFileReader.instances.length, 2);
    assert.equal(ui.button('siteSettings.save').disabled, true);
    await ui.submit();
    assert.equal(saved.length, 0);
    await act(async () => {
      ControlledFileReader.instances[0].succeed('light-logo');
      await flushEvents();
    });
    assert.equal(ui.button('siteSettings.save').disabled, true);
    await act(async () => {
      ControlledFileReader.instances[1].succeed('dark-logo');
      await flushEvents();
    });
    assert.equal(ui.button('siteSettings.save').disabled, false);
    await ui.save();
    assert.equal(saved[0].logo, 'light-logo');
    assert.equal(saved[0].logo_dark, 'dark-logo');
  } finally {
    await ui.unmount();
  }
});

test('invalid form submission does not save and a corrected name can be submitted', async () => {
  const { Simulate } = await import('react-dom/test-utils');
  const ui = await mountEditor();
  const input = ui.container.querySelector<HTMLInputElement>('#site_name')!;
  try {
    await act(async () => {
      input.value = '   ';
      Simulate.change(input);
    });
    await ui.save();
    assert.equal(saved.length, 0);
    assert.ok(
      ui.container.textContent?.includes('siteSettings.siteNameRequired')
    );
    await act(async () => {
      input.value = 'Corrected Lab';
      Simulate.change(input);
    });
    await ui.save();
    assert.equal(saved.length, 1);
    assert.equal(saved[0].site_name, 'Corrected Lab');
  } finally {
    await ui.unmount();
  }
});
