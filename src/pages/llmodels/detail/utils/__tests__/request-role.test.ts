import assert from 'node:assert/strict';
import { test } from 'node:test';
import { effectiveRequestRole } from '../request-role';

const instances = [
  { id: 1, role: 'prefill' },
  { id: 2, role: 'decode' },
  { id: 3, role: 'router' },
  { id: 4, role: 'prefill' }
];
test('an explicit PD role remains authoritative over the selected instance set', () => {
  assert.equal(
    effectiveRequestRole({ role: 'prefill', instanceIds: [2] }, instances),
    'prefill'
  );
  assert.equal(
    effectiveRequestRole({ role: 'router', instanceIds: [] }, instances),
    'router'
  );
});
test('a selected Prefill or Router instance keeps its local request observations', () => {
  assert.equal(
    effectiveRequestRole({ role: 'all', instanceIds: [1] }, instances),
    'prefill'
  );
  assert.equal(
    effectiveRequestRole({ role: 'all', instanceIds: [1, 4] }, instances),
    'prefill'
  );
  assert.equal(
    effectiveRequestRole({ role: 'all', instanceIds: [3] }, instances),
    'router'
  );
});
test('a mixed pool selects one request role rather than adding role-local child requests', () => {
  assert.equal(
    effectiveRequestRole({ role: 'all', instanceIds: [1, 2] }, instances),
    'decode'
  );
  assert.equal(
    effectiveRequestRole({ role: 'all', instanceIds: [1, 2, 3] }, instances),
    'decode'
  );
  assert.equal(
    effectiveRequestRole({ role: 'all', instanceIds: [1, 3] }, instances),
    'prefill'
  );
});
test('the initial whole-deployment scope and unresolved instance metadata retain the Decode default', () => {
  assert.equal(
    effectiveRequestRole({ role: 'all', instanceIds: [] }, instances),
    'decode'
  );
  assert.equal(
    effectiveRequestRole({ role: 'all', instanceIds: [1] }),
    'decode'
  );
  assert.equal(
    effectiveRequestRole({ role: 'all', instanceIds: [1, 99] }, instances),
    'decode'
  );
});
