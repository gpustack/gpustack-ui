import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const element = ({ children }: any) => createElement('span', null, children);
mock.module('@gpustack/core-ui', {
  namedExports: {
    AutoTooltip: element,
    ColumnSettings: element,
    InfoColumn: element
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: any) => id })
  }
});
mock.module('antd', {
  namedExports: {
    ConfigProvider: element,
    Tag: element,
    Tooltip: element,
    Typography: { Text: element }
  }
});
mock.module('antd-style', {
  namedExports: { createStyles: () => () => ({ styles: {} }) }
});
mock.module(new URL('../../../../config/settings.ts', import.meta.url).href, {
  namedExports: { tableSorter: () => undefined }
});
mock.module(new URL('../../config/index.ts', import.meta.url).href, {
  namedExports: {
    LoadTypeValueMap: { Concurrency: 'concurrency' },
    TargetModeValueMap: { Instance: 'model_instance', Route: 'route' },
    loadTypeOptions: [],
    targetModeOptions: [],
    loadValueDecimals: (record: any) =>
      record.load_type === 'concurrency' ? 0 : 2
  }
});
mock.module(
  new URL('../../components/benchmark-state-tag.tsx', import.meta.url).href,
  {
    defaultExport: () => null
  }
);
mock.module(new URL('../../utils/validity-warning.ts', import.meta.url).href, {
  namedExports: { getValidityWarningPresentation: () => ({}) }
});
const { default: useColumnSettings } = await import('../use-column-settings');

const renderBest = (record: any) => {
  const Harness = () => {
    const { columns } = useColumnSettings({
      contentHeight: 600,
      profileOptions: [],
      clusterList: []
    });
    const column = columns.find(
      (column) => column.dataIndex === 'recommended_rate'
    )!;
    return (column.render as any)(record.recommended_rate, record);
  };
  return renderToStaticMarkup(createElement(Harness));
};

for (const loadType of ['concurrency', 'fixed_rate']) {
  test(`Best @ follows legacy SLO capacity for ${loadType}`, () => {
    const html = renderBest({
      load_type: loadType,
      recommended_rate: 128,
      slo_met_rate: 512,
      slo_avg_ttft_ms: 500
    });
    assert.match(html, /512/);
    assert.doesNotMatch(html, /128/);
  });
}

test('Best @ honors exact primary descriptors and explicit no-primary results', () => {
  const record = {
    recommended_rate: 128,
    slo_met_rate: 512,
    slo_avg_ttft_ms: 500,
    validity: { primary_point: { rate: 256, sequence: 1, input_tokens: 1024 } }
  };
  assert.match(renderBest(record), /256/);
  assert.equal(
    renderBest({ ...record, validity: { primary_point: null } }),
    '<span>-</span>'
  );
});

test('Best @ retains non-SLO recommendations', () => {
  assert.match(renderBest({ recommended_rate: 128, slo_met_rate: 512 }), /128/);
});
