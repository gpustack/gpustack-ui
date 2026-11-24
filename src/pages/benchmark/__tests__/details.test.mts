import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, forwardRef } from 'react';
import { createRoot } from 'react-dom/client';

const dom = new JSDOM('<div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
after(() => dom.window.close());
let params = new URLSearchParams('id=58'),
  record: any = { id: 58, name: 'API run name', state: 'completed' };
let options: any[] = [],
  select: any;
const navigate = mock.fn();
const pass = ({ children }: any) => createElement('div', {}, children);
mock.module('@umijs/max', {
  namedExports: {
    Link: ({ to, children }: any) => createElement('a', { href: to }, children),
    useSearchParams: () => [params],
    useNavigate: () => navigate,
    useIntl: () => ({
      formatMessage: ({ id }: any) =>
        id === 'benchmark.title' ? 'Benchmarks' : id
    })
  }
});
mock.module('ahooks', {
  namedExports: {
    useMemoizedFn: (f: any) => f,
    useThrottleFn: (f: any) => ({ run: f })
  }
});
mock.module('antd', { namedExports: { Flex: pass } });
mock.module('@gpustack/core-ui', {
  namedExports: {
    BaseSelect: (props: any) => {
      select = props;
      return createElement(
        'span',
        { title: props.title },
        props.options.find((o: any) => o.value === props.value)?.label
      );
    },
    DeleteModal: forwardRef(() => null)
  }
});
mock.module(new URL('../../_components/page-box.tsx', import.meta.url).href, {
  namedExports: { HeaderLeft: pass }
});
mock.module(
  new URL('../../_components/page-breadcrumb/index.tsx', import.meta.url).href,
  {
    defaultExport: ({ items }: any) =>
      createElement(
        'div',
        {},
        items.map((item: any, i: number) =>
          createElement('span', { key: i }, item.title)
        )
      )
  }
);
mock.module(new URL('../apis/index.ts', import.meta.url).href, {
  namedExports: { deleteBenchmark() {} }
});
for (const file of [
  'components/benchmark-state-tag.tsx',
  'components/dashboard-link.tsx',
  'components/detail-content.tsx',
  'components/fade-in.tsx',
  'components/row-actions.tsx',
  'components/view-logs-modal.tsx'
])
  mock.module(new URL('../' + file, import.meta.url).href, {
    defaultExport: file.includes('fade-in') ? pass : () => null
  });
mock.module(new URL('../hooks/use-clone-benchmark.ts', import.meta.url).href, {
  defaultExport: () => ({ cloneBenchmarkOnList() {} })
});
mock.module(new URL('../hooks/use-view-logs.ts', import.meta.url).href, {
  defaultExport: () => ({
    openViewLogsModal() {},
    closeViewLogsModal() {},
    openViewLogsModalStatus: {}
  })
});
mock.module(
  new URL('../services/use-export-benchmark.ts', import.meta.url).href,
  { namedExports: { useExportBenchmark: () => ({ exportData() {} }) } }
);
mock.module(
  new URL('../services/use-query-benchmarks.ts', import.meta.url).href,
  {
    defaultExport: () => ({
      dataList: options,
      fetchData() {},
      cancelRequest() {}
    })
  }
);
mock.module(new URL('../services/use-query-detail.ts', import.meta.url).href, {
  defaultExport: () => ({
    detailData: record,
    loading: false,
    fetchData() {},
    cancelRequest() {}
  })
});
mock.module(
  new URL('../services/use-query-profiles.ts', import.meta.url).href,
  {
    defaultExport: () => ({
      profilesOptions: [],
      fetchProfilesData() {},
      cancelRequest() {}
    })
  }
);
mock.module(
  new URL('../services/use-stop-benchmark.ts', import.meta.url).href,
  { defaultExport: () => ({ handleStopBenchmark() {} }) }
);
mock.module(new URL('../services/use-watch-detail.ts', import.meta.url).href, {
  defaultExport() {}
});
const { default: Details } = await import('../details');
const root = createRoot(document.getElementById('root')!);
after(async () => {
  await act(async () => root.unmount());
});

test('id-only detail derives its selected label and page title from the matching API record', async () => {
  params = new URLSearchParams('id=58');
  options = [];
  record = { id: 58, name: 'Authoritative API name' };
  await act(async () => root.render(createElement(Details)));
  assert.equal(select.value, 58);
  assert.equal(select.title, record.name);
  assert.equal(select['aria-label'], record.name);
  assert.ok(document.body.textContent!.includes(record.name));
  assert.equal(document.title, 'Benchmarks - Authoritative API name');
  assert.equal(
    document.querySelector('a')?.getAttribute('href'),
    '/models/benchmark'
  );
  params = new URLSearchParams('id=58&name=stale-url-name');
  await act(async () => root.render(createElement(Details)));
  assert.equal(select.title, record.name);
});

test('a different pending run cannot borrow the previous record name, and selecting a run safely encodes its name', async () => {
  params = new URLSearchParams('id=59');
  options = [];
  record = { id: 58, name: 'Previous run' };
  await act(async () => root.render(createElement(Details)));
  assert.equal(select.value, 59);
  assert.ok(!select.title.includes('Previous run'));
  const label = 'PD & name #中文';
  select.onChange(60, { value: 60, label });
  const path = navigate.mock.calls.at(-1)!.arguments[0];
  const next = new URLSearchParams(path.split('?')[1]);
  assert.equal(next.get('id'), '60');
  assert.equal(next.get('name'), label);
});
