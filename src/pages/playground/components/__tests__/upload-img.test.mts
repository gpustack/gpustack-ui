import { JSDOM } from 'jsdom';
import assert from 'node:assert';
import test, { mock } from 'node:test';
import { createElement as h } from 'react';

// Batches delivered to the consumer under test.
const deliveries: { uid: string | number; dataUrl: string }[][] = [];
// FileReader instances awaiting a scripted `onload`.
const readers: any[] = [];

let uploadOnChange: ((info: any) => void) | null = null;

mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      locale: 'en-US',
      formatMessage: ({ id }: { id: string }) => id
    })
  }
});

mock.module('antd', {
  namedExports: {
    Button: () => null,
    Tooltip: ({ children }: any) => children,
    Upload: (props: any) => {
      uploadOnChange = props.onChange;
      return h('div', { 'data-testid': 'upload' });
    }
  }
});

mock.module('@ant-design/icons', {
  namedExports: { PictureOutlined: () => null }
});

const setupDom = () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {
    url: 'http://localhost/'
  });
  const keys = [
    'window',
    'document',
    'navigator',
    'IS_REACT_ACT_ENVIRONMENT',
    ...Object.getOwnPropertyNames(dom.window).filter(
      (key) => !(key in globalThis)
    )
  ];
  const saved = new Map<string, PropertyDescriptor | undefined>();
  Object.defineProperties(
    globalThis,
    Object.fromEntries(
      keys.map((key) => [
        key,
        {
          configurable: true,
          value:
            key === 'IS_REACT_ACT_ENVIRONMENT' ? true : (dom.window as any)[key]
        }
      ])
    )
  );
  keys.forEach((key) =>
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
  );

  // Scripted FileReader / Image: decode completion is driven BY THE TEST,
  // which is exactly what lets us reproduce "A decodes slower than B".
  Object.defineProperty(globalThis, 'FileReader', {
    configurable: true,
    writable: true,
    value: class {
      onload: any = null;
      result: any = null;
      uid: string | null = null;
      readAsDataURL(file: any) {
        // The test's fake files carry the uid in `name`, letting
        // finishRead() target a SPECIFIC read instead of "whichever is
        // first" (decode order is the whole point of these scenarios).
        this.uid = file?.name?.replace('.png', '') ?? null;
        readers.push(this);
      }
    }
  });
  Object.defineProperty(globalThis, 'Image', {
    configurable: true,
    writable: true,
    value: class {
      width = 10;
      height = 10;
      onload: any = null;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
  });

  return () => {
    for (const [key, descriptor] of saved) {
      if (descriptor) {
        Object.defineProperty(globalThis, key, descriptor);
      } else {
        delete (globalThis as any)[key];
      }
    }
  };
};

const mount = async () => {
  const { act } = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { default: UploadImg } = await import('../upload-img');

  const container = document.getElementById('root')!;
  const root = createRoot(container);
  await act(async () => {
    root.render(
      h(UploadImg, {
        multiple: false,
        handleUpdateImgList: (batch: any[]) => deliveries.push(batch)
      })
    );
  });
  return { act, root };
};

const select = (uid: string) => ({
  fileList: [{ uid, originFileObj: { name: `${uid}.png` } }]
});

// Finish the pending read for `uid`.
const finishRead = (uid: string) => {
  const reader = readers.find(
    (item) => item.uid === uid && item.result === null
  );
  assert.ok(reader, `a pending read for ${uid} must exist`);
  reader.result = `data:image/png;base64,${uid}`;
  reader.onload();
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test('single-select: a slow-decoding A never overwrites the later choice B', async () => {
  const restore = setupDom();
  try {
    await mount();

    // Scenario 1: A finishes decoding AFTER B.
    uploadOnChange!(select('a'));
    uploadOnChange!(select('b'));
    finishRead('b');
    finishRead('a');
    await sleep(450);
    assert.deepEqual(
      deliveries.map((batch) => batch.map((item) => item.uid)),
      [['b']],
      'scenario 1 (A decodes after B): only B is delivered'
    );
    assert.equal(
      deliveries[0][0].dataUrl,
      'data:image/png;base64,b',
      'the delivered image is B itself, not a stale decode of A'
    );

    // Scenario 2: A already sits in the pending queue (its debounce is
    // armed) while B is still decoding when the window elapses.
    readers.length = 0;
    deliveries.length = 0;
    uploadOnChange!(select('a2'));
    finishRead('a2');
    uploadOnChange!(select('b2'));
    await sleep(450); // debounce fires here with only stale A2 queued
    assert.equal(
      deliveries.length,
      0,
      'the stale queued A2 is dropped at delivery time'
    );
    finishRead('b2');
    await sleep(450);

    assert.deepEqual(
      deliveries.map((batch) => batch.map((item) => item.uid)),
      [['b2']],
      'scenario 2 (A2 queued, B2 decoding): only B2 is delivered'
    );
    assert.equal(
      deliveries[0][0].dataUrl,
      'data:image/png;base64,b2',
      'the delivered image is B2 itself'
    );
  } finally {
    restore();
  }
});
