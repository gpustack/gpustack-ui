import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import messages from '../../../../../locales/en-US/benchmark';

const translations = (messages as any).default ?? messages;
let table: any;
const selects: any[] = [];
const element = ({ children }: any) => createElement('div', null, children);
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: any) => translations[id] || id })
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    Table: (props: any) => {
      table = props;
      return null;
    }
  }
});
mock.module('antd', {
  namedExports: {
    Flex: element,
    Typography: { Text: element },
    Button: element,
    Select: (props: any) => {
      selects.push(props);
      return null;
    }
  }
});
mock.module(new URL('../stage-observations.tsx', import.meta.url).href, {
  namedExports: { MonitoringNotice: () => null }
});
const { default: StageComparison } = await import('../stage-comparison');
const points = [280, 282, 281].map((load, sequence) => ({
  id: sequence + 1,
  load,
  tps: load * 100,
  total: 1000,
  ok: 1000,
  raw: { id: sequence + 1, sequence, input_tokens: 128, rate: load }
})) as any;
const data = {
  context: { stages: [], capabilities: {} },
  errors: {},
  runtime: null,
  resources: null
} as any;

for (const [basis, expected] of [
  ['adjacent', 28000],
  ['previous', 28200]
] as const) {
  test(`${basis} comparison uses its own measured baseline`, () => {
    renderToStaticMarkup(
      createElement(StageComparison, {
        point: points[2],
        points,
        baselineId: null,
        basis,
        onBaseline() {},
        onShowBands() {},
        data,
        dataForPoint: () => data,
        onEvidence() {}
      })
    );
    assert.equal(
      table.dataSource.find((row: any) => row.key === 'tps').baseline,
      expected
    );
    assert.equal(selects.at(-1).value, basis);
  });
}

test('a custom baseline from a different input length cannot supply comparison measurements', () => {
  const other = {
    ...points[0],
    id: 99,
    raw: { ...points[0].raw, input_tokens: 256 }
  };
  renderToStaticMarkup(
    createElement(StageComparison, {
      point: points[2],
      points: [...points, other],
      baselineId: 99,
      basis: 'custom',
      onBaseline() {},
      onShowBands() {},
      data,
      dataForPoint: () => data,
      onEvidence() {}
    })
  );
  assert.equal(
    table.dataSource.find((row: any) => row.key === 'tps').baseline,
    undefined
  );
});

test('stage comparison uses the evaluated success rates on both sides', () => {
  const baseline = { ...points[0], total: 120, ok: 90, successRate: 0.9 };
  const current = { ...points[1], total: 65, ok: 54, successRate: 1 };
  renderToStaticMarkup(
    createElement(StageComparison, {
      point: current,
      points: [baseline, current],
      baselineId: baseline.id,
      basis: 'custom',
      onBaseline() {},
      onShowBands() {},
      data,
      dataForPoint: () => data,
      onEvidence() {}
    })
  );
  const row = table.dataSource.find((item: any) => item.key === 'success');
  assert.equal(row.current, 100);
  assert.equal(row.baseline, 90);
});
