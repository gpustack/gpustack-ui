import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { after, mock, test } from 'node:test';
import { act, createElement, forwardRef } from 'react';

const require = createRequire(import.meta.url);
const { default: en } = require('../../../locales/en-US/backends.ts');
const { default: zh } = require('../../../locales/zh-CN/backends.ts');

const empty = () => null;
const childrenOnly = ({ children }: any) => children;
let isAdmin = true;
let language: 'en' | 'zh' = 'en';
let filterProps: any;
let emptyProps: any;
const queryParams = { page: 2, name: 'llama', backend_source: 'community' };
const refresh = mock.fn();
const changeQuery = mock.fn();
const fetchData = mock.fn();
const saveScroll = mock.fn();
const restoreScroll = mock.fn();
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      formatMessage: ({ id }: { id: string }) =>
        (language === 'en' ? en : zh)[id] || id
    })
  }
});
mock.module('@ant-design/icons', {
  namedExports: { PlusOutlined: empty }
});
mock.module('antd', {
  namedExports: {
    Button: ({ children, icon, type, onClick }: any) =>
      createElement('button', { onClick, 'data-type': type }, icon, children),
    Space: childrenOnly
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    IconFont: ({ type }: any) => createElement('svg', { 'data-icon': type }),
    useBodyScroll: () => ({
      saveScrollHeight: saveScroll,
      restoreScrollHeight: restoreScroll
    }),
    DeleteModal: forwardRef(empty),
    InfiniteScrollerProvider: childrenOnly,
    FilterBar: (props: any) => {
      filterProps = props;
      return createElement('div', { 'data-toolbar': true }, props.right);
    },
    // Filtering and visibility belong to the shared NoResult. Capture the
    // page's CTA binding without substituting its filtering behavior.
    NoResult: (props: any) => {
      emptyProps = props;
      return null;
    }
  }
});
const moduleMock = (path: string, exports: any) =>
  mock.module(new URL(path, import.meta.url).href, exports);
moduleMock('../../_components/source-config/index.tsx', {
  namedExports: { useSourceConfigVisible: () => isAdmin }
});
moduleMock('../components/backend-source-entry.tsx', {
  defaultExport: ({ onSaved }: any) =>
    createElement('button', { onClick: onSaved }, 'sources')
});
moduleMock('../../../hooks/use-table-fetch.ts', {
  defaultExport: () => ({
    dataSource: { dataList: [], loading: false, loadend: true },
    queryParams,
    modalRef: { current: null },
    handleQueryChange: changeQuery,
    fetchData,
    handleDelete: empty,
    handleSearch: refresh,
    handleNameChange: empty
  })
});
moduleMock('../apis/index.ts', {
  namedExports: {
    INFERENCE_BACKEND_API: '/inference-backends',
    queryBackendsList: empty,
    createBackend: empty,
    createBackendFromYAML: empty,
    deleteBackend: empty,
    updateBackend: empty,
    updateBackendFromYAML: empty
  }
});
moduleMock('../config/index.ts', {
  namedExports: {
    backendSourceOptions: [],
    BackendSourceValueMap: { BUILTIN: 'built_in', COMMUNITY: 'community' },
    json2Yaml: empty,
    yaml2Json: empty
  }
});
moduleMock('../hooks/use-export-yaml.ts', {
  defaultExport: () => ({ exportYAML: empty })
});
moduleMock('../services/use-enable-backend.ts', {
  defaultExport: () => ({ handleEnableBackend: empty })
});
moduleMock('../../_components/page-box.tsx', { defaultExport: childrenOnly });
moduleMock('../components/backend-list.tsx', { defaultExport: empty });
moduleMock('../components/version-info-modal.tsx', { defaultExport: empty });
moduleMock('../components/add-modal.tsx', {
  defaultExport: ({ open, title, onClose, action }: any) =>
    open
      ? createElement(
          'section',
          { 'data-custom': action },
          title,
          createElement('button', { onClick: onClose }, 'close custom')
        )
      : null
});
moduleMock('../community/add-community-modal.tsx', {
  defaultExport: ({ open, onClose, onRefresh }: any) =>
    open
      ? createElement(
          'section',
          { 'data-community': true },
          createElement('button', { onClick: onClose }, 'close market'),
          createElement('button', { onClick: onRefresh }, 'refresh market')
        )
      : null
});

const dom = new JSDOM('<!doctype html><div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
after(() => dom.window.close());
const { createRoot } = await import('react-dom/client');
const { default: BackendList } = await import('../index.tsx');

function button(label: string): HTMLButtonElement {
  const result = [...document.querySelectorAll('button')].find(
    (item) => item.textContent === label
  );
  assert.ok(result, `Missing button: ${label}`);
  return result;
}
const click = async (label: string) => {
  await act(async () => button(label).click());
};
async function mount(t: any) {
  saveScroll.mock.resetCalls();
  restoreScroll.mock.resetCalls();
  refresh.mock.resetCalls();
  changeQuery.mock.resetCalls();
  fetchData.mock.resetCalls();
  const root = createRoot(document.getElementById('root')!);
  t.after(async () => {
    await act(async () => root.unmount());
  });
  await act(async () => root.render(createElement(BackendList)));
  return root;
}

for (const [locale, marketplace, add, browse] of [
  ['en', 'Marketplace', 'Add Backend', 'Browse Marketplace'],
  ['zh', '社区市场', '添加后端', '浏览社区市场']
] as const) {
  test(`${locale}: marketplace and add open their drawers in one click`, async (t) => {
    language = locale;
    isAdmin = true;
    await mount(t);
    assert.equal(button(marketplace).dataset.type, undefined);
    assert.equal(button(add).dataset.type, 'primary');
    assert.ok(button(marketplace).querySelector('[data-icon="icon-public"]'));
    assert.equal(document.querySelector('[data-community]'), null);
    assert.equal(document.querySelector('[data-custom]'), null);

    await click(marketplace);
    assert.ok(document.querySelector('[data-community]'));
    assert.equal(document.querySelector('[data-custom]'), null);
    assert.equal(saveScroll.mock.callCount(), 1);
    await click('close market');
    assert.equal(restoreScroll.mock.callCount(), 1);

    await click(add);
    assert.ok(document.querySelector('[data-custom="create"]'));
    assert.ok(
      document.querySelector('[data-custom]')!.textContent!.includes(add)
    );
    assert.equal(document.querySelector('[data-community]'), null);
    assert.equal(saveScroll.mock.callCount(), 2);
    await click('close custom');
    assert.equal(restoreScroll.mock.callCount(), 2);

    assert.equal(emptyProps.buttonText, browse);
    assert.equal(emptyProps.buttonIcon.props.type, 'icon-public');
    await act(async () => emptyProps.onClick());
    assert.ok(document.querySelector('[data-community]'));
  });
}

test('source settings remain admin-only and both direct actions stay visible', async (t) => {
  language = 'en';
  isAdmin = false;
  const root = await mount(t);
  assert.deepEqual(
    [...document.querySelectorAll('[data-toolbar] button')].map(
      (item) => item.textContent
    ),
    ['Marketplace', 'Add Backend']
  );
  isAdmin = true;
  await act(async () => root.render(createElement(BackendList)));
  await click('sources');
  assert.equal(refresh.mock.callCount(), 1);
});

test('market refresh and close preserve the page query and scroll lifecycle', async (t) => {
  language = 'en';
  isAdmin = true;
  await mount(t);
  const filters = structuredClone(emptyProps.filters);
  await click('Marketplace');
  await click('refresh market');
  assert.equal(refresh.mock.callCount(), 1);
  await click('close market');
  assert.deepEqual(emptyProps.filters, filters);
  assert.equal(changeQuery.mock.callCount(), 0);
  assert.equal(fetchData.mock.callCount(), 0);
  assert.equal(saveScroll.mock.callCount(), 1);
  assert.equal(restoreScroll.mock.callCount(), 1);
});

test('toolbar allows wrapping while keeping the action group right-aligned', async (t) => {
  await mount(t);
  assert.equal(filterProps.styles.root.flexWrap, 'wrap');
  assert.equal(filterProps.styles.right.marginInlineStart, 'auto');
  assert.equal(filterProps.styles.right.flexShrink, 0);
});
