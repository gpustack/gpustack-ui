import assert from 'node:assert/strict';
import test from 'node:test';
import {
  configurationChangeMessage,
  instanceDeleteMessages
} from '../instance-recreation';

test('role-bearing deployments explain that pending configuration prevents recreation', () => {
  assert.equal(configurationChangeMessage(true), 'models.pd.recreation.paused');
  assert.equal(
    configurationChangeMessage(true, true),
    'models.pd.recreation.paused'
  );
});

test('plain deployments keep their configuration hints without a recreation warning', () => {
  assert.equal(configurationChangeMessage(false), 'models.pd.stale');
  assert.equal(
    configurationChangeMessage(false, true),
    'models.pd.instance.stale'
  );
});

test('deleting a member of a stale group warns without promising recreation', () => {
  assert.deepEqual(
    instanceDeleteMessages({ roles: [{ name: 'prefill' }], stale: true }),
    {
      okText: 'common.button.delete',
      tip: 'models.pd.instance.delete.stale'
    }
  );
});

for (const [name, model] of [
  ['a group on its current configuration', { roles: [{}], stale: false }],
  ['a group with no staleness report', { roles: [{}], stale: null }],
  ['an edited plain deployment', { roles: null, stale: true }],
  ['a deployment with an empty role list', { roles: [], stale: true }]
] as const) {
  test(`deleting an instance of ${name} keeps the recreation action`, () => {
    assert.deepEqual(instanceDeleteMessages(model), {
      okText: 'common.button.delrecreate'
    });
  });
}
