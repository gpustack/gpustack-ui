import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, forwardRef } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, useSearchParams } from 'react-router-dom';

const dom = new JSDOM('<div id="root"></div>', {
  url: 'http://localhost/#/models/benchmark/detail?id=9&point=12&phase=10:1&zoom=point'
});
Object.defineProperties(globalThis, {
  window: { value: dom.window, configurable: true },
  document: { value: dom.window.document, configurable: true },
  navigator: { value: dom.window.navigator, configurable: true },
  IS_REACT_ACT_ENVIRONMENT: { value: true, configurable: true }
});
after(() => dom.window.close());
const element = ({ children }: any) => createElement('div', null, children);
mock.module('@umijs/max', {
  namedExports: {
    useSearchParams,
    useIntl: () => ({ formatMessage: ({ id }: any) => id })
  }
});
mock.module('antd-style', {
  namedExports: { createStyles: () => () => ({ styles: {} }) }
});
mock.module(
  new URL('../../../config/detail-context.ts', import.meta.url).href,
  {
    namedExports: {
      useDetailContext: () => ({
        id: 9,
        detailData: { load_type: 'concurrency' }
      })
    }
  }
);
let completeResults: (rows: any[]) => void;
mock.module(new URL('../../../apis/index.ts', import.meta.url).href, {
  namedExports: {
    queryBenchmarkResults: () =>
      new Promise((resolve) => {
        completeResults = resolve;
      })
  }
});
for (const filename of [
  'best-points.tsx',
  'config-summary.tsx',
  'metrics-result.tsx',
  'overview.tsx',
  'running-hint.tsx',
  'validity-alert.tsx'
]) {
  mock.module(new URL(`../${filename}`, import.meta.url).href, {
    defaultExport: () => null
  });
}
mock.module(new URL('../../config-source-alert.tsx', import.meta.url).href, {
  defaultExport: () => null
});
mock.module(new URL('../ui.tsx', import.meta.url).href, {
  namedExports: {
    Panel: element,
    SectionTitle: element,
    getStageStatus: () => 'ok'
  }
});
const monitoringMounts: any[] = [];
mock.module(new URL('../stage-monitoring.tsx', import.meta.url).href, {
  defaultExport: forwardRef((props: any, _ref) => {
    monitoringMounts.push(props);
    return null;
  })
});
const { default: Summary } = await import('../index');

test('delayed initial results cannot mount monitoring or choose a default phase before the saved result is available', async () => {
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(createElement(HashRouter, null, createElement(Summary)))
  );
  assert.equal(
    monitoringMounts.length,
    0,
    'monitoring context starts only after the result list resolves'
  );
  await act(async () =>
    completeResults([
      {
        id: 11,
        sequence: 0,
        input_tokens: 10,
        rate: 16,
        request_total: 1,
        request_successful: 1
      },
      {
        id: 12,
        sequence: 1,
        input_tokens: 10,
        rate: 32,
        request_total: 1,
        request_successful: 1
      }
    ])
  );
  assert.equal(monitoringMounts.length, 1);
  assert.equal(monitoringMounts[0].selected.id, 12);
  assert.equal(monitoringMounts[0].inspection.phaseId, '10:1');
  assert.equal(monitoringMounts[0].inspection.zoom, true);
  await act(async () => root.unmount());
});
