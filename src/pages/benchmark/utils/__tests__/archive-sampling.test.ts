import assert from 'node:assert/strict';
import { test } from 'node:test';
import { archiveSamplingDetails } from '../archive-sampling';

const storage = {
  source: 'archive',
  run_id: 'run',
  content_version: 'saved-3'
};
const context = {
  observation_storage: storage,
  stages: [30.25, 38.75, 75.95, 57.4, 47.98, 66.19, 10].map(
    (duration, index) => ({
      id: String(index),
      start: 100,
      end: 100 + duration
    })
  )
} as any;
const runtime = {
  observation_storage: storage,
  start: 100,
  end: 440,
  rate_window_seconds: 75,
  metrics: {
    running: { kind: 'gauge', status: 'available' },
    ttft: { kind: 'histogram', status: 'available' },
    unavailable: { kind: 'gauge', status: 'unsupported' }
  },
  sample_statistics: {
    running: [{ observed_samples: 339, expected_samples: 340 }],
    unavailable: [{ observed_samples: 0, expected_samples: 340 }]
  }
} as any;
const data = (value: any) => ({
  window: { start: 100, end: 440 },
  ...value
});

test('reports the saved first-scrape gap without treating unsupported metrics as missing', () => {
  const result = archiveSamplingDetails(context, data({ runtime }));
  assert.equal(result.coverage?.observed, 339);
  assert.equal(result.coverage?.expected, 340);
  assert.equal(result.coverage?.percent.toFixed(1), '99.7');
  assert.equal(result.shortPhases, 6);
  assert.equal(result.phaseCount, 7);
  assert.equal(result.rateWindow, 75);
});

test('a selected long phase does not claim other short phases are in its interval', () => {
  const result = archiveSamplingDetails(
    context,
    data({
      runtime: { ...runtime, phase_id: '2' }
    })
  );
  assert.equal(result.shortPhases, 0);
  assert.equal(result.phaseCount, 1);
});

test('does not borrow coverage or rolling windows from another revision or live response', () => {
  for (const changed of [
    { ...storage, content_version: 'saved-2' },
    { ...storage, run_id: 'other-run' },
    { ...storage, source: 'live' }
  ]) {
    const result = archiveSamplingDetails(
      context,
      data({
        runtime: { ...runtime, observation_storage: changed }
      })
    );
    assert.equal(result.coverage, null);
    assert.equal(result.shortPhases, 0);
  }
});

test('only reports a real observed shortfall, retaining zero observations and ignoring invalid budgets', () => {
  for (const sample of [
    { observed_samples: 4, expected_samples: 4 },
    { observed_samples: 0, expected_samples: 0 },
    { observed_samples: 0, expected_samples: Infinity }
  ]) {
    assert.equal(
      archiveSamplingDetails(
        context,
        data({
          runtime: { ...runtime, sample_statistics: { running: [sample] } }
        })
      ).coverage,
      null
    );
  }
  assert.equal(
    archiveSamplingDetails(
      context,
      data({
        runtime: {
          ...runtime,
          sample_statistics: {
            running: [{ observed_samples: 0, expected_samples: 4 }]
          }
        }
      })
    ).coverage?.observed,
    0
  );
});

test('does not mix an old phase or interval into the current range diagnostics', () => {
  const old = { ...runtime, start: 90, end: 99, phase_id: 'old' };
  const result = archiveSamplingDetails(
    context,
    data({
      runtime: old,
      instances: old,
      resources: old
    })
  );
  assert.equal(result.coverage, null);
  assert.equal(result.shortPhases, 0);
  const mixed = archiveSamplingDetails(
    context,
    data({
      runtime: { ...runtime, phase_id: '2', sample_statistics: {} },
      resources: { ...runtime, phase_id: 'old' }
    })
  );
  assert.equal(mixed.coverage, null);
});
