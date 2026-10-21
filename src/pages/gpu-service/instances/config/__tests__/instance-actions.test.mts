import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import type { ListItem } from '../types';

mock.module('@gpustack/core-ui', {
  namedExports: { IconFont: () => null, icons: {} }
});
mock.module(new URL('../../../../../config/index.ts', import.meta.url).href, {
  namedExports: { StatusMaps: {} }
});

const { rowActionList } = await import('../index.ts');
const instance = (phase?: string): ListItem =>
  ({ status: phase ? { phase } : undefined }) as ListItem;
const isVisible = (key: string, record: ListItem) => {
  const action = rowActionList.find((item) => item.key === key);
  assert.ok(action, `Missing action: ${key}`);
  return action.show ? action.show(record) : true;
};

test('Failed instances expose View Events without enabling runtime actions', () => {
  const record = instance('Failed');
  assert.equal(isVisible('viewevent', record), true);
  for (const key of ['viewlog', 'start', 'stop']) {
    assert.equal(isVisible(key, record), false, key);
  }
});

test('existing Kubernetes and Starting phases retain View Events', () => {
  for (const phase of [
    'Scheduling',
    'Pending',
    'Scheduled',
    'Initializing',
    'InitializeFailed',
    'Initialized',
    'Preparing',
    'NotReady',
    'Ready',
    'Starting'
  ]) {
    assert.equal(isVisible('viewevent', instance(phase)), true, phase);
  }
});

test('GPUStack failures and unavailable phases do not expose View Events', () => {
  for (const phase of [
    'CreateFailed',
    'SSHPublicKeyCreateFailed',
    'PersistentVolumeTypeCreateFailed',
    'PersistentVolumeCreateFailed',
    'Deleting',
    'Stopping',
    'Stopped',
    'Unknown',
    undefined
  ]) {
    assert.equal(isVisible('viewevent', instance(phase)), false, phase);
  }
});
