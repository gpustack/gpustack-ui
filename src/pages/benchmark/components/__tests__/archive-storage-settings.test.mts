import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import messages from '../../../../locales/en-US/benchmark';

const dom = new JSDOM('<div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { value: dom.window, configurable: true },
  document: { value: dom.window.document, configurable: true },
  navigator: { value: dom.window.navigator, configurable: true },
  IS_REACT_ACT_ENVIRONMENT: { value: true, configurable: true }
});
after(() => dom.window.close());
const translations = (messages as any).default ?? messages;
let admin = true;
mock.module('@umijs/max', {
  namedExports: {
    useAccess: () => ({ canSeeAdmin: admin }),
    useIntl: () => ({
      formatMessage: ({ id }: any, values: any = {}) =>
        Object.entries(values).reduce(
          (text, [key, value]) => text.replace(`{${key}}`, String(value)),
          translations[id] || id
        )
    })
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
          if (lock.current) return;
          lock.current = true;
          callback();
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
const element = ({ children }: any) => createElement('div', null, children);
let successes = 0;
mock.module('antd', {
  namedExports: {
    Flex: element,
    Skeleton: () => createElement('span', { role: 'status' }, 'Loading'),
    Alert: ({ title, action }: any) =>
      createElement('div', { role: 'alert' }, title, action),
    Typography: {
      Text: ({ children, ...props }: any) =>
        createElement('span', { id: props.id, role: props.role }, children)
    },
    Descriptions: ({ items }: any) =>
      createElement(
        'dl',
        null,
        items.map((item: any) =>
          createElement(
            'div',
            { key: item.key },
            `${item.label}: ${item.children}`
          )
        )
      ),
    Switch: ({ checked, disabled, onChange, id }: any) =>
      createElement('input', {
        type: 'checkbox',
        id,
        checked,
        disabled,
        onChange: (event: any) => onChange(event.target.checked)
      }),
    InputNumber: ({ value, onChange, ...props }: any) =>
      createElement('input', {
        id: props.id,
        'aria-label': props['aria-label'],
        'aria-invalid': props['aria-invalid'],
        'aria-describedby': props['aria-describedby'],
        value: value ?? '',
        disabled: props.disabled,
        onInput: (event: any) => onChange(event.target.value)
      }),
    Button: ({ children, onClick, disabled }: any) =>
      createElement('button', { onClick, disabled }, children),
    Modal: ({
      open,
      title,
      children,
      onCancel,
      onOk,
      okButtonProps,
      confirmLoading
    }: any) =>
      open
        ? createElement(
            'section',
            { role: 'dialog', 'aria-label': title },
            children,
            createElement('button', { onClick: onCancel }, 'Cancel'),
            createElement(
              'button',
              {
                onClick: onOk,
                disabled: okButtonProps?.disabled || confirmLoading
              },
              'Save'
            )
          )
        : null,
    message: { success: () => successes++ }
  }
});

let reads = 0;
const writes: number[] = [];
const signals: AbortSignal[] = [];
const unlimited = {
  max_bytes: 0,
  unlimited: true,
  used_bytes: 1024,
  remaining_bytes: null,
  usage_percent: null,
  state: 'unlimited',
  warning_threshold_percent: 80
};
let read: () => Promise<any> = async () => unlimited;
let write: () => Promise<any> = async () => unlimited;
mock.module(new URL('../../apis/index.ts', import.meta.url).href, {
  namedExports: {
    queryArtifactStorageCapacity: async (signal: AbortSignal) => {
      reads++;
      signals.push(signal);
      return read();
    },
    updateArtifactStorageCapacity: async (bytes: number) => {
      writes.push(bytes);
      return write();
    }
  }
});
const { default: ArchiveStorageSettings } =
  await import('../archive-storage-settings');
const body = () => document.body.textContent || '';
const button = (label: string) =>
  [...document.querySelectorAll('button')].find(
    (item) => item.textContent === label
  )!;
const mount = async () => {
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(ArchiveStorageSettings)));
  return root;
};
const open = async () => act(async () => button('Archive storage').click());
const input = async (value: string) =>
  act(async () => {
    const field = document.querySelector<HTMLInputElement>(
      '#benchmark-storage-limit'
    )!;
    field.value = value;
    field.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });

test('only platform administrators see the entry and opening is the sole initial read action', async () => {
  admin = false;
  const previous = reads;
  const root = await mount();
  assert.equal(body(), '');
  assert.equal(reads, previous);
  admin = true;
  await act(async () => root.render(createElement(ArchiveStorageSettings)));
  assert.equal(reads, previous);
  await open();
  assert.equal(reads, previous + 1);
  assert.match(body(), /1 KiB/);
  assert.doesNotMatch(body(), /Reserved for uploads/);
  assert.match(body(), /Unlimited capacity/);
  await act(async () => root.unmount());
});

test('switching to finite capacity validates and saves rounded whole bytes once', async () => {
  const root = await mount();
  await open();
  await act(async () =>
    document
      .querySelector<HTMLInputElement>('#benchmark-storage-unlimited')!
      .click()
  );
  assert.equal(button('Save').disabled, true);
  await input('0.1');
  let finish!: (value: any) => void;
  write = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  const previous = writes.length;
  await act(async () => {
    button('Save').click();
    button('Save').click();
  });
  assert.deepEqual(writes.slice(previous), [107374182]);
  await act(async () => finish(unlimited));
  assert.equal(document.querySelector('[role="dialog"]'), null);
  write = async () => unlimited;
  await act(async () => root.unmount());
});

test('existing byte-level limits remain unchanged and can be made unlimited', async () => {
  read = async () => ({
    ...unlimited,
    max_bytes: 37,
    unlimited: false,
    remaining_bytes: 0,
    state: 'full'
  });
  const root = await mount();
  await open();
  assert.match(body(), /Existing archives remain available/);
  await act(async () => button('Save').click());
  assert.equal(writes.at(-1), 37);
  await open();
  await act(async () =>
    document
      .querySelector<HTMLInputElement>('#benchmark-storage-unlimited')!
      .click()
  );
  await act(async () => button('Save').click());
  assert.equal(writes.at(-1), 0);
  read = async () => unlimited;
  await act(async () => root.unmount());
});

test('read failures retain an error and disabled save rather than claiming unlimited', async () => {
  read = async () => {
    throw { response: { status: 503 } };
  };
  const root = await mount();
  await open();
  assert.match(body(), /Unable to read storage capacity/);
  assert.doesNotMatch(body(), /Unlimited capacity/);
  assert.equal(button('Save').disabled, true);
  read = async () => unlimited;
  await act(async () => button('Retry').click());
  assert.match(body(), /Saved monitoring data/);
  await act(async () => root.unmount());
});

test('save failures preserve edits and permission denial disables further writes', async () => {
  const root = await mount();
  await open();
  await act(async () =>
    document
      .querySelector<HTMLInputElement>('#benchmark-storage-unlimited')!
      .click()
  );
  await input('64');
  write = async () => {
    throw { response: { status: 503 } };
  };
  await act(async () => button('Save').click());
  assert.match(body(), /Your changes have been retained/);
  assert.equal(
    document.querySelector<HTMLInputElement>('#benchmark-storage-limit')!.value,
    '64'
  );
  write = async () => {
    throw { response: { status: 403 } };
  };
  await act(async () => button('Save').click());
  assert.match(body(), /Only platform administrators/);
  assert.equal(button('Save').disabled, true);
  assert.equal(
    document.querySelector<HTMLInputElement>('#benchmark-storage-limit')!
      .disabled,
    true
  );
  write = async () => unlimited;
  await act(async () => root.unmount());
});

test('closing during a read aborts it and a stale result cannot reopen settings', async () => {
  let finish!: (value: any) => void;
  read = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  const root = await mount();
  await open();
  await act(async () => button('Cancel').click());
  assert.equal(signals.at(-1)!.aborted, true);
  await act(async () => finish(unlimited));
  assert.equal(document.querySelector('[role="dialog"]'), null);
  read = async () => unlimited;
  await act(async () => root.unmount());
});

test('revoking administrator access aborts reads and discards capacity details', async () => {
  let finish!: (value: any) => void;
  read = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  const root = await mount();
  await open();
  admin = false;
  await act(async () => root.render(createElement(ArchiveStorageSettings)));
  assert.equal(signals.at(-1)!.aborted, true);
  await act(async () => finish(unlimited));
  assert.equal(body(), '');
  read = async () => unlimited;
  admin = true;
  await act(async () => root.unmount());
});

test('a save finishing after closing does not close a newer dialog or show success', async () => {
  let finish!: (value: any) => void;
  write = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  const root = await mount();
  await open();
  const previous = successes;
  await act(async () => button('Save').click());
  await act(async () => button('Cancel').click());
  await open();
  await act(async () => finish(unlimited));
  assert.ok(document.querySelector('[role="dialog"]'));
  assert.equal(successes, previous);
  write = async () => unlimited;
  await act(async () => root.unmount());
});
