import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CHART_SERIES_COLORS } from '../../../../../config/chart-colors';
import { assignEntityColors, seriesAppearance } from '../chart-series';
import { metricSeriesLabel, seriesIdentity } from '../metrics';

const gpu = (id: string, name = id): any => ({
  name,
  statistic: 'current',
  dimensions: { device_id: id, worker_id: 5 },
  points: [[1, 0]]
});

test('input, output and total throughput share round legend markers and solid lines', () => {
  const measures = ['Input tokens', 'Output tokens', 'Total tokens'];
  for (const dark of [false, true]) {
    const appearances = measures.map((name) =>
      seriesAppearance(
        { ...gpu(''), name, statistic: 'rate', dimensions: {} },
        false,
        measures,
        dark
      )
    );
    assert.equal(new Set(appearances.map((item) => item.color)).size, 3);
    assert.ok(appearances.every((item) => item.symbol === 'circle'));
    assert.ok(appearances.every((item) => item.symbolLabel === '●'));
    assert.ok(appearances.every((item) => item.pattern === 'solid'));
  }
});

test('GPU styles and selection identity survive filtering, sorting and readable renames', () => {
  const original = Array.from({ length: 32 }, (_, i) => gpu(`gpu-${i}`));
  const slots = assignEntityColors(original, [], new Map());
  const appearances = new Map(
    original.map((item) => [
      seriesIdentity(item),
      seriesAppearance(item, false, [], false, slots)
    ])
  );
  for (const item of [...original].reverse().filter((_, i) => i % 2 === 0)) {
    const renamed = { ...item, name: 'renamed worker / GPU' };
    assert.deepEqual(
      seriesAppearance(renamed, false, [], false, slots),
      appearances.get(seriesIdentity(renamed))
    );
  }
  assert.ok(
    new Set(
      [...appearances.values()].map((value) =>
        JSON.stringify([value.color, value.pattern, value.symbol])
      )
    ).size === 32
  );
  assert.ok(
    [...appearances.values()].every((value) => value.pattern === 'solid')
  );
});

test('each statistic and instance has a distinct Benchmark color that survives filtering and missing statistics', () => {
  const source: any[] = [11, 25].flatMap((id) =>
    ['avg', 'p50', 'p95', 'p99'].map((statistic) => ({
      name: `Instance ${id}`,
      statistic,
      dimensions: { model_instance_id: id },
      points: []
    }))
  );
  const domain = ['instance:11', 'instance:25'];
  const full = assignEntityColors(source, domain, new Map());
  const subset = assignEntityColors(
    source.filter((item) => item.dimensions.model_instance_id === 25),
    domain,
    new Map()
  );
  for (const dark of [false, true]) {
    const color = (item: any, slots: Map<string, number>) =>
      seriesAppearance(item, true, [], dark, slots).color;
    assert.deepEqual(
      source.map((item) => color(item, full)),
      [...CHART_SERIES_COLORS[dark ? 'dark' : 'light']]
    );
    assert.equal(new Set(source.map((item) => color(item, full))).size, 8);
    for (const item of [...source].reverse()) {
      assert.equal(color(item, full), color(item, subset));
      assert.equal(
        color({ ...item, name: 'renamed' }, full),
        color(item, full)
      );
    }
    const partial = assignEntityColors([source[7]], domain, new Map());
    assert.equal(color(source[7], full), color(source[7], partial));
  }
});

test('composed instance measures receive separate stable colors rather than darkened copies of one entity color', () => {
  const measures = ['Input', 'Output', 'Total'];
  const source: any[] = [11, 25].flatMap((id) =>
    measures.map((name) => ({
      name,
      statistic: 'rate',
      dimensions: { model_instance_id: id },
      points: []
    }))
  );
  const slots = assignEntityColors(source, [], new Map());
  const appearances = source.map((item) =>
    seriesAppearance(item, false, measures, false, slots)
  );
  assert.equal(new Set(appearances.map((item) => item.color)).size, 6);
  assert.ok(appearances.every((item) => item.pattern === 'solid'));
  assert.equal(
    seriesAppearance(source[5], false, measures, false, slots).color,
    appearances[5].color
  );
});

test('multi-GPU memory measure labels preserve the device and composition identities distinguish used and total', () => {
  const used = {
    ...gpu('gpu-0'),
    name: 'Used · Worker A / GPU 0',
    compositionKey: 'used:gpu-0'
  };
  const total = {
    ...gpu('gpu-0'),
    name: 'Total · Worker A / GPU 0',
    compositionKey: 'total:gpu-0'
  };
  assert.equal(
    metricSeriesLabel(used, ['Used', 'Total']),
    'Used · Worker A / GPU 0'
  );
  assert.equal(
    metricSeriesLabel(total, ['Used', 'Total']),
    'Total · Worker A / GPU 0'
  );
  assert.notEqual(seriesIdentity(used), seriesIdentity(total));
});

test('latency labels put the statistic before the instance while hiding only internal legacy source markers', () => {
  const source: any = {
    name: 'raw',
    statistic: 'p95',
    dimensions: {
      model_instance_id: 4,
      model_instance_name: 'Model A',
      source_name: 'legacy'
    },
    points: []
  };
  assert.equal(metricSeriesLabel(source), 'P95 · Model A');
  assert.equal(
    seriesIdentity(source),
    seriesIdentity({
      ...source,
      name: 'renamed',
      dimensions: { ...source.dimensions, model_instance_name: 'renamed' }
    })
  );
});
