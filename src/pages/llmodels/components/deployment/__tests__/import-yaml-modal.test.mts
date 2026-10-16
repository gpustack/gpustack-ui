import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, Fragment } from 'react';
import { createRoot } from 'react-dom/client';

const empty = () => null;
const passChildren = ({ children }: any) =>
  createElement(Fragment, null, children);
let fileSelection: Promise<boolean>;
const importModels = mock.fn(async (_body: any, _options: any) => ({
  entries: [],
  valid: true,
  items: []
}));

// Keep the real drawer's event handlers and state, while replacing browser-only
// widgets and the import service at their public boundaries.
mock.module('@ant-design/icons', {
  namedExports: {
    ExclamationCircleFilled: empty,
    LeftOutlined: empty,
    LoadingOutlined: empty,
    RightOutlined: empty,
    UploadOutlined: empty
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    AlertBlockInfo: ({ title, message }: any) =>
      createElement('div', { role: 'alert' }, title, message),
    BaseSelect: empty,
    GSDrawer: ({ children, footer, onClose }: any) =>
      createElement(
        Fragment,
        null,
        createElement('button', { onClick: onClose }, 'Close drawer'),
        children,
        footer
      ),
    IconFont: empty,
    ModalFooter: ({ description }: any) =>
      createElement('footer', null, description),
    OverlayScroller: passChildren,
    useSubmitLock: () => ({
      loading: false,
      guard: (action: () => void) => action(),
      run: (action: () => void) => action()
    })
  }
});
mock.module('@gpustack/core-ui/yaml-editor', {
  namedExports: {
    checkYamlFile: (file: File) =>
      file.name === 'rejected.txt' ? { id: 'unsupported-file' } : null,
    preloadYamlEditor: empty,
    YamlDiffEditor: ({ modified, onChange, onBlur }: any) =>
      createElement(
        Fragment,
        null,
        createElement('output', { 'data-draft': true }, modified),
        createElement('textarea', {
          'aria-label': 'YAML editor',
          defaultValue: modified,
          onInput: (event: any) => onChange(event.currentTarget.value),
          onBlur: (event: any) => onBlur(event.currentTarget.value)
        })
      )
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: any) => id })
  }
});
mock.module('antd', {
  namedExports: {
    Button: ({ onClick, disabled, children }: any) =>
      createElement('button', { onClick, disabled }, children),
    Flex: passChildren,
    Modal: empty,
    Space: passChildren,
    Upload: ({ beforeUpload, children }: any) =>
      createElement(
        Fragment,
        null,
        children,
        createElement('input', {
          type: 'file',
          'aria-label': 'YAML file',
          onChange: (event: any) => {
            fileSelection = beforeUpload(event.currentTarget.files[0]);
          }
        })
      )
  }
});
mock.module(
  new URL('../../../../../hooks/use-user-settings.ts', import.meta.url).href,
  { defaultExport: () => ({ isDarkTheme: false }) }
);
mock.module(new URL('../../../apis/index.ts', import.meta.url).href, {
  namedExports: { importModels }
});
mock.module(
  new URL('../../../config/deploments-context.ts', import.meta.url).href,
  { namedExports: { useDeploymentsContext: () => ({ clusterList: [] }) } }
);
for (const name of ['import-yaml-drawer', 'import-yaml-modal']) {
  mock.module(
    new URL(`../../../style/${name}.module.less`, import.meta.url).href,
    { defaultExport: {} }
  );
}
mock.module(new URL('../plan-nav-list.tsx', import.meta.url).href, {
  defaultExport: empty
});

const dom = new JSDOM('<div id="root"></div>', {
  url: 'http://localhost/'
});
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
after(() => dom.window.close());

const { default: ImportYamlModal } = await import('../import-yaml-modal.tsx');

const deferred = () => {
  let resolve!: (text: string) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<string>((success, failure) => {
    resolve = success;
    reject = failure;
  });
  return { promise, resolve, reject };
};
const file = (name: string, text: Promise<string>) => {
  const value = new dom.window.File([], name);
  Object.defineProperty(value, 'text', { value: () => text });
  return value;
};
const chooseFile = async (value: ReturnType<typeof file>) => {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: [value]
  });
  await act(async () => {
    input.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  });
  return { finished: fileSelection };
};
const mount = async () => {
  importModels.mock.resetCalls();
  const onCancel = mock.fn();
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(
      createElement(ImportYamlModal, {
        open: true,
        onCancel,
        onOk: empty
      })
    )
  );
  return { root, onCancel };
};
const draft = () => document.querySelector('[data-draft]')?.textContent;
const alert = () => document.querySelector('[role="alert"]')?.textContent;

for (const outcome of ['success', 'failure']) {
  test(`a superseded file read ${outcome} cannot replace the newer file or its review`, async (t) => {
    const { root } = await mount();
    t.after(async () => act(async () => root.unmount()));
    const oldRead = deferred();
    const old = await chooseFile(file('old.yaml', oldRead.promise));
    await chooseFile(file('new.yaml', Promise.resolve('name: new\n')));
    assert.equal(draft(), 'name: new\n');
    assert.equal(importModels.mock.callCount(), 1);

    await act(async () => {
      if (outcome === 'success') oldRead.resolve('name: old\n');
      else oldRead.reject(new Error('old read failed'));
      await old.finished;
    });

    assert.equal(draft(), 'name: new\n');
    assert.ok(document.body.textContent!.includes('new.yaml'));
    assert.equal(alert(), undefined);
    assert.equal(importModels.mock.callCount(), 1);
    assert.equal(
      importModels.mock.calls[0].arguments[0].content,
      'name: new\n'
    );
  });
}

for (const outcome of ['success', 'failure']) {
  test(`closing the drawer ignores a late file read ${outcome}`, async (t) => {
    const { root, onCancel } = await mount();
    t.after(async () => act(async () => root.unmount()));
    const reading = deferred();
    const selection = await chooseFile(file('closed.yaml', reading.promise));
    await act(async () => {
      document.querySelector<HTMLButtonElement>('button')!.click();
    });
    assert.equal(onCancel.mock.callCount(), 1);

    await act(async () => {
      if (outcome === 'success') reading.resolve('name: closed\n');
      else reading.reject(new Error('closed read failed'));
      await selection.finished;
    });

    assert.equal(draft(), undefined);
    assert.equal(alert(), undefined);
    assert.equal(document.querySelector('footer'), null);
    assert.ok(document.body.textContent!.includes('models.import.empty.title'));
    assert.equal(importModels.mock.callCount(), 0);
  });
}

test('a rejected new file also supersedes an older pending read', async (t) => {
  const { root } = await mount();
  t.after(async () => act(async () => root.unmount()));
  const reading = deferred();
  const old = await chooseFile(file('old.yaml', reading.promise));
  await chooseFile(file('rejected.txt', Promise.resolve('not YAML')));
  assert.ok(alert()!.includes('unsupported-file'));

  await act(async () => {
    reading.resolve('name: old\n');
    await old.finished;
  });

  assert.ok(alert()!.includes('unsupported-file'));
  assert.equal(draft(), undefined);
  assert.equal(importModels.mock.callCount(), 0);
});

test('rejecting a file clears the pending editor debounce and checking hint', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { root } = await mount();
  t.after(async () => act(async () => root.unmount()));
  await chooseFile(file('model.yaml', Promise.resolve('name: model\n')));
  const editor = document.querySelector<HTMLTextAreaElement>('textarea')!;
  await act(async () => {
    editor.value = 'name: edited\n';
    editor.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });
  assert.ok(
    document
      .querySelector('footer')!
      .textContent!.includes('models.import.checking')
  );

  await chooseFile(file('rejected.txt', Promise.resolve('not YAML')));
  assert.ok(alert()!.includes('unsupported-file'));
  assert.ok(
    !document
      .querySelector('footer')!
      .textContent!.includes('models.import.checking')
  );
  await act(async () => t.mock.timers.tick(1000));
  assert.equal(importModels.mock.callCount(), 1);
  assert.ok(alert()!.includes('unsupported-file'));
});
