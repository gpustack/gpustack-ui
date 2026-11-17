import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { act, createElement, createRef, forwardRef } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import messages from '../../../../../locales/en-US/benchmark';

const translations = (messages as any).default ?? messages;
let detail: any = {
  load_type: 'concurrency',
  auto_tune: true,
  profile: 'Meet Latency SLO'
};
let chartProps: any;
let drawerProps: any;
let measurementSwitcher: any;
let selectedPoint: any;
const points = [280, 282, 281].map((load, sequence) => ({
  id: sequence + 1,
  load,
  total: 100,
  ok: 100,
  raw: { id: sequence + 1, rate: load, sequence, input_tokens: 128 }
})) as any;
const phases = points.map((p: any) => ({
  id: `128:${p.raw.sequence}`,
  sequence: p.raw.sequence,
  input_tokens: 128,
  status: 'available',
  start: 100 + p.raw.sequence * 30,
  end: 125 + p.raw.sequence * 30,
  measurement_number: p.raw.sequence + 1
}));
const data: any = {
  context: {
    benchmark_id: 1,
    stages: phases,
    run_window: { start: 100, end: 185 },
    capabilities: {}
  },
  window: { start: 100, end: 185 },
  errors: {},
  load() {},
  ensureView() {}
};
const element = ({ children }: any) => createElement('div', null, children);
mock.module(new URL('../monitoring-archive-status.tsx', import.meta.url).href, {
  defaultExport: () => null
});
mock.module('@ant-design/icons', {
  namedExports: {
    ClockCircleOutlined: () => null,
    ProfileOutlined: () => null,
    ReloadOutlined: () => null,
    RightOutlined: () => null
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: any) => translations[id] || id })
  }
});
mock.module('antd', {
  namedExports: {
    Flex: element,
    Space: element,
    Tooltip: element,
    Button: ({ children, ...rest }: any) =>
      createElement(
        'button',
        { 'aria-pressed': rest['aria-pressed'] },
        children
      ),
    Select: (props: any) => {
      measurementSwitcher = props;
      return null;
    },
    Typography: { Text: element, Title: element }
  }
});
mock.module('antd-style', {
  namedExports: { createStyles: () => () => ({ styles: {} }) }
});
mock.module(
  new URL('../../../config/detail-context.ts', import.meta.url).href,
  {
    namedExports: {
      useDetailContext: () => ({ id: 1, refreshToken: 0, detailData: detail })
    }
  }
);
mock.module(
  new URL('../../../services/use-monitoring.ts', import.meta.url).href,
  { defaultExport: () => data }
);
mock.module(
  new URL('../../../services/use-phase-observations.ts', import.meta.url).href,
  { defaultExport: () => ({ get: () => data, load() {}, updateContext() {} }) }
);
mock.module(new URL('../monitoring-charts.tsx', import.meta.url).href, {
  defaultExport: forwardRef((props: any, _ref) => {
    chartProps = props;
    return createElement('div', null, props.controls);
  })
});
mock.module(new URL('../stage-timeline.tsx', import.meta.url).href, {
  defaultExport: () => null
});
mock.module(new URL('../stage-results-drawer.tsx', import.meta.url).href, {
  defaultExport: (props: any) => {
    drawerProps = props;
    return null;
  }
});
mock.module(
  new URL(
    '../../../../llmodels/detail/components/help-tooltip.tsx',
    import.meta.url
  ).href,
  { defaultExport: () => null }
);
const { default: StageMonitoring } = await import('../stage-monitoring');
const render = (selected = points[2]) =>
  renderToStaticMarkup(
    createElement(StageMonitoring, {
      points,
      probes: [],
      selected,
      inspection: {
        pointId: null,
        phaseId: null,
        pointView: 'load',
        zoom: false,
        view: 'aggregate',
        cursor: null
      },
      onInspectionChange() {},
      onSelect(point: any) {
        selectedPoint = point;
      }
    })
  );

test('adaptive monitoring supplies load-ordered original windows and stable measurement numbers', () => {
  render();
  assert.deepEqual(
    chartProps.timeSegments.map((s: any) => [
      s.label,
      s.caption,
      s.start,
      s.end
    ]),
    [
      ['280', '#1', 100, 125],
      ['281', '#3', 160, 185],
      ['282', '#2', 130, 155]
    ]
  );
  assert.match(chartProps.timeSegments[1].description, /281.*concurrency/);
  assert.deepEqual(chartProps.range, { start: 100, end: 185 });
});

test('compact navigation selects the same recorded measurements and preserves load order', () => {
  render();
  assert.equal(measurementSwitcher.value, points[2].id);
  assert.deepEqual(
    measurementSwitcher.options.map((option: any) => option.value),
    [1, 3, 2]
  );
  assert.match(measurementSwitcher.options[1].label, /281.*#3/);
  measurementSwitcher.onChange(points[0].id);
  assert.equal(selectedPoint, points[0]);
});

test('request-rate profiles label segments in req/s and retain the same actual windows', () => {
  detail = { ...detail, load_type: 'fixed_rate', profile: 'Custom' };
  render();
  assert.match(chartProps.timeSegments[1].description, /281 req\/s/);
  assert.equal(chartProps.timeSegments[1].start, 160);
  detail = { ...detail, load_type: 'concurrency' };
});

test('a saturation probe uses the actual time axis instead of joining the ordered load points', () => {
  render({ ...points[0], raw: { ...points[0].raw, rate: null } });
  assert.equal(chartProps.timeSegments, undefined);
});

for (const source of ['ordinary', 'paged', 'archive'] as const)
  test(`chart comparison from a zoomed measurement loads both phases (${source})`, async () => {
    const dom = new JSDOM('<div id="root"></div>');
    Object.defineProperties(globalThis, {
      window: { value: dom.window, configurable: true },
      document: { value: dom.window.document, configurable: true },
      navigator: { value: dom.window.navigator, configurable: true },
      IS_REACT_ACT_ENVIRONMENT: { value: true, configurable: true }
    });
    const original = data.context;
    const selectedRange =
      source === 'ordinary'
        ? { start: 160, end: 185 }
        : { start: 300, end: 325 };
    data.context = {
      ...original,
      stages: phases.map((phase: any) =>
        phase.id === phases[2].id ? { ...phase, ...selectedRange } : phase
      ),
      capabilities: { max_query_seconds: 100 },
      run_window: { start: 100, end: selectedRange.end },
      ...(source === 'archive'
        ? {
            observation_storage: { source: 'archive' },
            query_capabilities: { run_replay: true }
          }
        : {})
    };
    const props = {
      points,
      probes: [],
      selected: points[2],
      inspection: {
        pointId: points[2].id,
        phaseId: phases[2].id,
        pointView: 'load' as const,
        zoom: true,
        view: 'aggregate' as const,
        cursor: null
      },
      onInspectionChange: mock.fn(),
      onSelect() {}
    };
    const root = createRoot(document.getElementById('root')!);
    const load = mock.method(data, 'load');
    try {
      await act(async () => root.render(createElement(StageMonitoring, props)));
      assert.deepEqual(chartProps.range, selectedRange);
      await act(async () => drawerProps.onShowBands(points[0].id));
      assert.deepEqual(
        load.mock.calls.map((call) => call.arguments),
        [
          [
            source === 'paged'
              ? {
                  view: 'aggregate',
                  comparisonPhaseIds: [phases[0].id, phases[2].id]
                }
              : { view: 'aggregate' }
          ]
        ]
      );
      assert.equal(
        props.onInspectionChange.mock.calls[0].arguments[0].zoom,
        false
      );
      assert.deepEqual(
        chartProps.bands.map(({ kind, start, end }: any) => [kind, start, end]),
        [
          ['selected', selectedRange.start, selectedRange.end],
          ['baseline', 100, 125]
        ]
      );
      if (source === 'paged') {
        await act(async () => drawerProps.onBaseline(points[1].id));
        assert.deepEqual(load.mock.calls.at(-1)?.arguments, [
          { view: 'aggregate' }
        ]);
        assert.deepEqual(
          chartProps.bands.map(({ kind }: any) => kind),
          ['selected']
        );
      }
    } finally {
      load.mock.restore();
      await act(async () => root.unmount());
      dom.window.close();
      data.context = original;
    }
  });

test('a late result restores its saved phase once from the results completion action; history restores the run window', async () => {
  const dom = new JSDOM('<div id="root"></div>', {
    url: 'http://localhost/#/models/benchmark/detail?id=1&point=3&phase=128:2&zoom=point'
  });
  Object.defineProperties(globalThis, {
    window: { value: dom.window, configurable: true },
    document: { value: dom.window.document, configurable: true },
    navigator: { value: dom.window.navigator, configurable: true },
    IS_REACT_ACT_ENVIRONMENT: { value: true, configurable: true }
  });
  const calls: any[] = [];
  data.load = (query: any) => calls.push(query);
  const ref = createRef<any>();
  const { readBenchmarkInspection } =
    await import('../../../utils/inspection-url');
  const props = (items: any[]) => ({
    ref,
    points: items,
    probes: [],
    selected: items[0],
    inspection: readBenchmarkInspection(
      new URLSearchParams(dom.window.location.hash.split('?')[1]),
      1,
      items
    ),
    onInspectionChange() {},
    onSelect() {}
  });
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(createElement(StageMonitoring, props(points.slice(0, 2))))
  );
  assert.deepEqual(
    calls,
    [],
    'no effect-driven request when the linked result is absent'
  );
  await act(async () =>
    ref.current.restoreResults(points.map((point: any) => point.raw))
  );
  assert.deepEqual(calls, [{ view: 'aggregate', phase_id: '128:2' }]);
  await act(async () =>
    root.render(createElement(StageMonitoring, props(points)))
  );
  await act(async () =>
    ref.current.restoreResults(points.map((point: any) => point.raw))
  );
  assert.equal(
    calls.length,
    1,
    'the next results completion does not reload the same phase'
  );
  await act(async () => {
    dom.window.history.replaceState(null, '', '#/models/benchmark/detail?id=1');
    dom.window.dispatchEvent(new dom.window.PopStateEvent('popstate'));
    dom.window.dispatchEvent(new dom.window.PopStateEvent('popstate'));
  });
  assert.deepEqual(calls, [
    { view: 'aggregate', phase_id: '128:2' },
    { view: 'aggregate' }
  ]);
  await act(async () => root.unmount());
  dom.window.close();
});
