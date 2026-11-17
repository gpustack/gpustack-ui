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

test('aggregate timing curves use solid lines and distinct stable measure/statistic colors', () => {
  const measures = ['Queue', 'Stage', 'Full'];
  for (const dark of [false, true]) {
    const source: any[] = measures.map((name) => ({
      name,
      statistic: 'p99',
      comparisonMeasure: true,
      dimensions: { role: 'decode' },
      points: []
    }));
    const slots = assignEntityColors(source, ['instance:2'], new Map());
    const styles = source.map((s) =>
      seriesAppearance(s, true, measures, dark, slots)
    );
    assert.equal(new Set(styles.map((s) => s.color)).size, 3);
    assert.deepEqual(
      styles.map((s) => s.pattern),
      ['solid', 'solid', 'solid']
    );
    assert.equal(new Set(styles.map((s) => s.symbol)).size, 3);
    assert.notEqual(
      seriesAppearance(
        { ...source[2], statistic: 'avg' },
        true,
        measures,
        dark,
        slots
      ).color,
      styles[2].color
    );
    assert.deepEqual(
      seriesAppearance(source[2], true, measures, dark, slots),
      styles[2]
    );
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

test('neutral capacity never consumes a measure color and measured GPU colors match other panels', () => {
  const devices = [gpu('gpu-0'), gpu('gpu-1')];
  const domain = devices.map((item) => `device:${item.dimensions.device_id}`);
  const slots = assignEntityColors(devices, domain, new Map());
  for (const dark of [false, true]) {
    for (const device of devices) {
      const measured = seriesAppearance(device, false, [], dark, slots);
      const used = seriesAppearance(
        { ...device, name: `Used · ${device.name}` },
        false,
        ['Used', 'Total'],
        dark,
        slots,
        ['Total']
      );
      const total = seriesAppearance(
        { ...device, name: `Total · ${device.name}` },
        false,
        ['Used', 'Total'],
        dark,
        slots,
        ['Total']
      );
      assert.equal(used.color, measured.color);
      assert.equal(total.color, dark ? '#9aa4b1' : '#8b939e');
      assert.equal(used.pattern, 'solid');
      assert.equal(total.pattern, 'solid');
    }
  }
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

test('instance timing comparisons distinguish each measurement with color and retain solid lines', () => {
  const measures = ['Queue', 'Stage', 'Full'];
  const series: any[] = [2, 3].flatMap((id) =>
    measures.map((name) => ({
      name,
      statistic: 'p99',
      comparisonMeasure: true,
      dimensions: { model_instance_id: id },
      points: []
    }))
  );
  const slots = assignEntityColors(series, [], new Map());
  for (const dark of [false, true]) {
    const styles = series.map((item) =>
      seriesAppearance(item, true, measures, dark, slots)
    );
    assert.equal(new Set(styles.map((item) => item.color)).size, 6);
    assert.notEqual(styles[0].color, styles[3].color);
    assert.deepEqual(
      styles.slice(0, 3).map((item) => item.pattern),
      ['solid', 'solid', 'solid']
    );
    assert.notEqual(
      seriesAppearance(
        { ...series[5], statistic: 'avg' },
        true,
        measures,
        dark,
        slots
      ).color,
      styles[5].color
    );
  }
});

test('all twelve aggregate timing lines have distinct stable colors and remain solid', () => {
  const measures = ['Queue', 'Stage', 'Full'];
  const series = measures.flatMap((name) =>
    (['avg', 'p50', 'p95', 'p99'] as const).map((statistic) => ({
      name,
      statistic,
      comparisonMeasure: true,
      dimensions: { role: 'prefill' },
      points: []
    }))
  );
  for (const dark of [false, true]) {
    const styles = series.map((line) =>
      seriesAppearance(line, true, measures, dark)
    );
    assert.equal(
      new Set(
        styles.map((style) => JSON.stringify([style.color, style.pattern]))
      ).size,
      12
    );
    assert.equal(new Set(styles.map((style) => style.color)).size, 12);
    assert.ok(styles.every((style) => style.pattern === 'solid'));
    assert.deepEqual(
      seriesAppearance(series[11], true, measures, dark),
      styles[11]
    );
  }
});

test('interleaved PD instance identities retain 36 distinct solid-curve colors', () => {
  const measures = ['Queue', 'Stage', 'Full'];
  const series = [2, 3, 4].flatMap((id) =>
    measures.flatMap((name) =>
      (['avg', 'p50', 'p95', 'p99'] as const).map((statistic) => ({
        name,
        statistic,
        comparisonMeasure: true,
        dimensions: { model_instance_id: id },
        points: []
      }))
    )
  );
  const slots = new Map([
    ['instance:2', 0],
    ['instance:3', 3],
    ['instance:4', 7]
  ]);
  for (const dark of [false, true]) {
    const styles = series.map((line) =>
      seriesAppearance(line, true, measures, dark, slots)
    );
    assert.equal(new Set(styles.map((style) => style.color)).size, 36);
    assert.ok(styles.every((style) => style.pattern === 'solid'));
    for (const line of series
      .filter((line) => line.statistic === 'p99')
      .reverse()) {
      assert.deepEqual(
        seriesAppearance(line, true, measures, dark, slots),
        styles[series.indexOf(line)]
      );
    }
  }
});
