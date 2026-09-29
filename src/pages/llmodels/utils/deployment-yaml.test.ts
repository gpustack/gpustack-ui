import yaml from 'js-yaml';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { currentText, entryText } from '../components/deployment/plan-document';
import type { DeploymentPlanEntry } from '../config/types';
import { dumpDeploymentConfig } from './deployment-yaml';

test('import and revision YAML preserve schema order and explicit configuration', () => {
  const spec = {
    source: 'huggingface',
    replicas: 0,
    cpu_offloading: false,
    worker_selector: {},
    backend_parameters: [],
    env: { EXPLICIT_NULL: null, EMPTY: '', LONG_VALUE: 'word '.repeat(40) },
    roles: [{ name: 'decode', env: {} }]
  };
  const entry = {
    current: spec,
    desired: spec,
    raw: {}
  } as unknown as DeploymentPlanEntry;
  const text = dumpDeploymentConfig(spec);
  assert.equal(currentText(entry), text);
  assert.equal(entryText(entry), text);
  assert.deepEqual(yaml.load(text), spec);
  assert.deepEqual(Object.keys(yaml.load(text) as object), Object.keys(spec));
  assert.ok(text.includes('EXPLICIT_NULL: null'));
  assert.ok(text.includes(spec.env.LONG_VALUE.trim()));
});

test('clearing a configuration appears as a removed line in the displayed YAML', () => {
  const before = dumpDeploymentConfig({
    source: 'huggingface',
    env: { TOKEN: 'fixture' }
  });
  const after = dumpDeploymentConfig({ source: 'huggingface' });
  assert.ok(before.includes('env:'));
  assert.equal(after, 'source: huggingface\n');
});

test('invalid import entries preserve their raw null values for correction', () => {
  const entry = {
    current: {},
    desired: {},
    raw: { name: 'qwen', unknown: null }
  } as unknown as DeploymentPlanEntry;
  assert.equal(currentText(entry), '');
  assert.deepEqual(yaml.load(entryText(entry)), entry.raw);
});
