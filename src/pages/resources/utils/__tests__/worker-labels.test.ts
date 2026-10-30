import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildWorkerLabelOptions,
  formatWorkerLabel,
  isFilterableLabelKey
} from '../worker-labels';

test('flattens grouped label candidates into readable choices in server order', () => {
  const groups = [
    { key: 'Region', values: ['Beijing'] },
    { key: 'arch', values: ['amd64', 'arm64'] },
    { key: 'region', values: ['beijing', 'shanghai'] }
  ];
  const options = buildWorkerLabelOptions(groups);
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
      { key: 'city', values: ['New York, US'] },
      { key: 'empty', values: [''] },
      { key: 'url', values: ['a=b=c'] }
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
  assert.equal(isFilterableLabelKey(''), false);
  assert.equal(isFilterableLabelKey('a=b'), false);
  assert.equal(isFilterableLabelKey('arch'), true);
});

test('includes worker-name candidates alongside other labels and literal values', () => {
  assert.deepEqual(
    buildWorkerLabelOptions([
      { key: 'env', values: ['production'] },
      { key: 'team', values: ['worker-name'] },
      { key: 'worker-name-extra', values: ['custom'] },
      { key: 'worker-name', values: ['gpu-01', 'gpu-02'] }
    ]),
    [
      { value: 'env=production', label: 'env: production' },
      { value: 'team=worker-name', label: 'team: worker-name' },
      { value: 'worker-name-extra=custom', label: 'worker-name-extra: custom' },
      { value: 'worker-name=gpu-01', label: 'worker-name: gpu-01' },
      { value: 'worker-name=gpu-02', label: 'worker-name: gpu-02' }
    ]
  );
});

test('empty grouped candidates produce no options', () => {
  assert.deepEqual(buildWorkerLabelOptions([]), []);
});
