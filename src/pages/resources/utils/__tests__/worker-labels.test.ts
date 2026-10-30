import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildWorkerLabelOptions, formatWorkerLabel } from '../worker-labels';

test('collects readable unique label choices across all returned workers', () => {
  const workers = [
    { labels: { arch: 'amd64', region: 'beijing' } },
    { labels: { arch: 'amd64', Region: 'Beijing' } },
    { labels: { arch: 'arm64', region: 'shanghai' } },
    { labels: null },
    { labels: {} }
  ];
  const options = buildWorkerLabelOptions(workers as any);
  assert.deepEqual(options, [
    { value: 'Region=Beijing', label: 'Region: Beijing' },
    { value: 'arch=amd64', label: 'arch: amd64' },
    { value: 'arch=arm64', label: 'arch: arm64' },
    { value: 'region=beijing', label: 'region: beijing' },
    { value: 'region=shanghai', label: 'region: shanghai' }
  ]);
});

test('preserves literal spaces, commas, empty values and equals signs', () => {
  assert.deepEqual(
    buildWorkerLabelOptions([
      { labels: { city: 'New York, US', url: 'a=b=c', empty: '' } }
    ]),
    [
      { value: 'city=New York, US', label: 'city: New York, US' },
      { value: 'empty=', label: 'empty: ' },
      { value: 'url=a=b=c', label: 'url: a=b=c' }
    ]
  );
  assert.equal(formatWorkerLabel('url=a=b=c'), 'url: a=b=c');
});

test('does not offer keys that cannot be expressed by the exact-filter API', () => {
  assert.deepEqual(
    buildWorkerLabelOptions([
      { labels: { '': 'empty-key', 'a=b': 'ambiguous-key', arch: 'amd64' } }
    ]),
    [{ value: 'arch=amd64', label: 'arch: amd64' }]
  );
});
