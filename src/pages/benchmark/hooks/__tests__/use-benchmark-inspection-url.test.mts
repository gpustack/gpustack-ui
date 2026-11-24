import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, useNavigate, useSearchParams } from 'react-router-dom';
import type { StagePoint } from '../../components/summary/metrics';

const dom = new JSDOM('<div id="root"></div>', {
  url: 'http://localhost/#/models/benchmark'
});
Object.defineProperties(globalThis, {
  window: { value: dom.window, configurable: true },
  document: { value: dom.window.document, configurable: true },
  navigator: { value: dom.window.navigator, configurable: true },
  IS_REACT_ACT_ENVIRONMENT: { value: true, configurable: true }
});
after(() => dom.window.close());
mock.module('@umijs/max', { namedExports: { useSearchParams } });
const { default: useBenchmarkInspectionUrl } =
  await import('../use-benchmark-inspection-url');
const points = [{ id: 11 }, { id: 12 }] as StagePoint[];
let hook: ReturnType<typeof useBenchmarkInspectionUrl>;
let navigate: ReturnType<typeof useNavigate>;
const Harness = () => {
  hook = useBenchmarkInspectionUrl(9, points);
  navigate = useNavigate();
  return null;
};
const mount = async () => {
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(createElement(HashRouter, null, createElement(Harness)))
  );
  return root;
};
const travel = async (direction: 'back' | 'forward') => {
  await act(async () => {
    await new Promise<void>((resolve) => {
      dom.window.addEventListener('popstate', () => setTimeout(resolve, 0), {
        once: true
      });
      dom.window.history[direction]();
    });
  });
};
test('inspection survives remount and forward navigation without adding detail history entries', async () => {
  let root = await mount();
  const baseHistory = window.history.length;
  await act(async () => navigate('/models/benchmark/detail?id=9&name=hint'));
  await act(async () =>
    hook.updateInspection({ pointId: 11, phaseId: '10:0' })
  );
  assert.equal(window.history.length, baseHistory + 1);
  await act(async () =>
    hook.updateInspection({
      pointView: 'process',
      zoom: true,
      view: 'instances',
      latencyStatistics: ['avg', 'p95', 'p99']
    })
  );
  await act(async () => hook.updateInspection({ cursor: 150 }));
  await act(async () => hook.updateInspection({ cursor: null }));
  assert.ok(!window.location.hash.includes('cursor='));
  await act(async () => hook.updateInspection({ cursor: 151 }));
  assert.equal(window.history.length, baseHistory + 1);
  const pinned = { ...hook.inspection };
  await act(async () => root.unmount());
  root = await mount();
  assert.deepEqual(
    hook.inspection,
    pinned,
    'refresh/new mount reads the full state from URL'
  );
  await travel('back');
  assert.equal(window.location.hash, '#/models/benchmark');
  await travel('forward');
  assert.deepEqual(hook.inspection, pinned);
  assert.equal(
    new URLSearchParams(window.location.hash.split('?')[1]).get('name'),
    'hint'
  );
  await act(async () => root.unmount());
});
