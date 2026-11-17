import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, useRef, useState } from 'react';
import messages from '../../../../locales/en-US/benchmark';

const dom = new JSDOM('<div id="root"></div>');
const computedStyle = dom.window.getComputedStyle.bind(dom.window);
dom.window.getComputedStyle = (element) => computedStyle(element);
for (const key of [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'Element',
  'SVGElement',
  'Node',
  'MutationObserver',
  'ShadowRoot',
  'getComputedStyle'
]) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: key === 'window' ? dom.window : dom.window[key]
  });
}
Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
  configurable: true,
  value: true
});
dom.window.matchMedia = (media) => ({
  matches: false,
  media,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => false
});
after(() => dom.window.close());
const translations = (messages as any).default ?? messages;
mock.module('@umijs/max', {
  namedExports: {
    useAccess: () => ({ canSeeAdmin: true }),
    useIntl: () => ({ formatMessage: ({ id }: any) => translations[id] || id })
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    useSubmitLock: () => {
      const lock = useRef(false);
      const [loading, setLoading] = useState(false);
      return {
        loading,
        guard: (callback: () => void) => {
          if (!lock.current) {
            lock.current = true;
            callback();
          }
        },
        run: async (callback: () => Promise<void>) => {
          setLoading(true);
          try {
            await callback();
          } finally {
            lock.current = false;
            setLoading(false);
          }
        }
      };
    }
  }
});
const writes: number[] = [];
mock.module(new URL('../../apis/index.ts', import.meta.url).href, {
  namedExports: {
    queryArtifactStorageCapacity: async () => ({
      max_bytes: 1,
      unlimited: false,
      used_bytes: 0,
      remaining_bytes: 1,
      usage_percent: 0,
      state: 'normal',
      warning_threshold_percent: 80
    }),
    updateArtifactStorageCapacity: async (bytes: number) => {
      writes.push(bytes);
    }
  }
});
const { createRoot } = await import('react-dom/client');
const { default: ArchiveStorageSettings } =
  await import('../archive-storage-settings');

test('the real InputNumber keeps invalid visible text unsaveable through blur and recovers on valid typing', async () => {
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(ArchiveStorageSettings)));
  await act(async () => document.querySelector('button')!.click());
  const input = document.querySelector<HTMLInputElement>(
    '#benchmark-storage-limit'
  )!;
  const save = [...document.querySelectorAll('button')].find(
    (button) => button.textContent === 'common.button.save'
  )!;
  assert.ok(input);
  assert.equal(save.disabled, false);
  const setter = Object.getOwnPropertyDescriptor(
    dom.window.HTMLInputElement.prototype,
    'value'
  )!.set!;
  const type = async (value: string) =>
    act(async () => {
      input.focus();
      setter.call(input, value);
      input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    });
  for (const value of ['-1', 'abc', '8388608', '0']) {
    await type(value);
    assert.equal(input.value, value);
    assert.equal(input.getAttribute('aria-invalid'), 'true', value);
    assert.equal(save.disabled, true, value);
    await act(async () => input.blur());
    assert.equal(
      input.value,
      value,
      'blur must not replace visible invalid text with an old limit'
    );
    await act(async () => save.click());
    assert.deepEqual(writes, []);
  }
  await type('');
  assert.equal(save.disabled, true);
  await type('0.1');
  assert.equal(input.value, '0.1');
  assert.equal(input.getAttribute('aria-invalid'), 'false');
  assert.equal(save.disabled, false);
  await act(async () => save.click());
  assert.deepEqual(writes, [107374182]);
  await act(async () => root.unmount());
});
