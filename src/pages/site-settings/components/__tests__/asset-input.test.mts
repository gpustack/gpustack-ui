import assert from 'node:assert/strict';
import { after, beforeEach, mock, test } from 'node:test';
import { act, createElement, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ControlledFileReader,
  createTestDOM,
  flushEvents
} from '../../__tests__/test-dom.mts';

const dom = createTestDOM();
Object.assign(globalThis, { FileReader: ControlledFileReader });
after(() => dom.window.close());
beforeEach(() => {
  ControlledFileReader.instances = [];
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: { id: string }) => id })
  }
});
const { Form, message } = await import('antd');
const { default: AssetInput } = await import('../asset-input');
const errors: string[] = [];
mock.method(message, 'error', (text: string) => {
  errors.push(text);
});
beforeEach(() => {
  errors.length = 0;
});

async function mount(disabled = false, initial: string | null = null) {
  const container = document.getElementById('root')!;
  const root = createRoot(container);
  const changes: (string | null)[] = [];
  const reading: boolean[] = [];
  function Harness() {
    const [value, setValue] = useState(initial);
    return createElement(
      Form,
      { disabled },
      createElement(AssetInput, {
        value,
        label: 'Brand logo',
        onReading: (value: boolean) => reading.push(value),
        onChange: (next: string | null) => {
          changes.push(next);
          setValue(next);
        }
      })
    );
  }
  await act(async () => {
    root.render(createElement(Harness));
  });
  return {
    container,
    changes,
    reading,
    select: async (type: string, size = 32) => {
      const file = new dom.window.File([new Uint8Array(size)], 'brand.png', {
        type
      });
      await act(async () => {
        const input =
          container.querySelector<HTMLInputElement>('input[type="file"]')!;
        Object.defineProperty(input, 'files', {
          configurable: true,
          value: [file]
        });
        input.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
        await flushEvents();
      });
      return file;
    },
    unmount: () => act(async () => root.unmount())
  };
}

for (const type of ['image/png', 'image/jpeg', 'image/webp']) {
  test(`${type} is read locally, previewed, and can be cleared`, async () => {
    const ui = await mount();
    try {
      const file = await ui.select(type, 512 * 1024);
      assert.deepEqual(ui.reading, [true]);
      assert.equal(ControlledFileReader.instances[0].file, file);
      assert.equal(
        ui.container.querySelector<HTMLInputElement>('input[type="file"]')!
          .disabled,
        true
      );
      const data = `data:${type};base64,aGVsbG8=`;
      await act(async () => {
        ControlledFileReader.instances[0].succeed(data);
        await flushEvents();
      });
      assert.deepEqual(ui.changes, [data]);
      assert.deepEqual(ui.reading, [true, false]);
      assert.equal(
        ui.container.querySelector('img')?.getAttribute('src'),
        data
      );
      assert.equal(ui.container.querySelector('img')?.alt, 'Brand logo');
      assert.equal(
        ui.container.querySelector<HTMLInputElement>('input[type="file"]')!
          .disabled,
        false
      );
      await act(async () => {
        [...ui.container.querySelectorAll('button')]
          .find((b) => b.textContent === 'siteSettings.clear')!
          .click();
      });
      assert.deepEqual(ui.changes, [data, null]);
      assert.equal(ui.container.querySelector('img'), null);
      assert.deepEqual(errors, []);
    } finally {
      await ui.unmount();
    }
  });
}

for (const [type, size] of [
  ['image/png', 512 * 1024 + 1],
  ['image/svg+xml', 32],
  ['text/html', 32],
  ['', 32]
] as const) {
  test(`rejects ${type || 'unknown MIME'} at ${size} bytes before reading`, async () => {
    const ui = await mount(false, 'existing-logo');
    try {
      await ui.select(type, size);
      assert.equal(ControlledFileReader.instances.length, 0);
      assert.deepEqual(ui.changes, []);
      assert.deepEqual(ui.reading, []);
      assert.deepEqual(errors, ['siteSettings.assetHint']);
      assert.equal(
        ui.container.querySelector('img')?.getAttribute('src'),
        'existing-logo'
      );
    } finally {
      await ui.unmount();
    }
  });
}

test('read failure retains the current asset, unlocks the field, and permits retry', async () => {
  const ui = await mount(false, 'existing-logo');
  try {
    await ui.select('image/png');
    await act(async () => {
      ControlledFileReader.instances[0].fail();
      await flushEvents();
    });
    assert.deepEqual(ui.reading, [true, false]);
    assert.deepEqual(ui.changes, []);
    assert.deepEqual(errors, ['siteSettings.assetReadError']);
    assert.equal(
      ui.container.querySelector('img')?.getAttribute('src'),
      'existing-logo'
    );
    await ui.select('image/png');
    await act(async () => {
      ControlledFileReader.instances[1].succeed('replacement');
      await flushEvents();
    });
    assert.deepEqual(ui.changes, ['replacement']);
    assert.deepEqual(ui.reading, [true, false, true, false]);
  } finally {
    await ui.unmount();
  }
});

test('inherits the disabled form state for both upload and clear', async () => {
  const ui = await mount(true, 'existing-logo');
  try {
    assert.equal(
      ui.container.querySelector<HTMLInputElement>('input[type="file"]')!
        .disabled,
      true
    );
    const clear = [...ui.container.querySelectorAll('button')].find(
      (b) => b.textContent === 'siteSettings.clear'
    )!;
    assert.equal(clear.disabled, true);
    await act(async () => clear.click());
    assert.deepEqual(ui.changes, []);
  } finally {
    await ui.unmount();
  }
});
