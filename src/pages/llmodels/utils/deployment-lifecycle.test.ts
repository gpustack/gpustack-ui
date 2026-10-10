import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  canPauseDeployment,
  canResumeDeployment,
  getDeploymentFormReplicas,
  getStartUpdate,
  getStopUpdate,
  isSchedulePaused,
  isWaitingForSchedule
} from './deployment-lifecycle';

const schedule = {
  enabled: true,
  baseline_replicas: 0,
  rules: [{ start_cron: '0 9 * * *', duration_seconds: 3600, replicas: 4 }]
};

for (const replicas of [0, 4]) {
  test(`an enabled schedule at ${replicas} replicas offers pause without start`, () => {
    const record = { replicas, scaling_schedule: schedule };
    assert.equal(canPauseDeployment(record), true);
    assert.equal(canResumeDeployment(record), false);
    assert.equal(isWaitingForSchedule(record), replicas === 0);
    assert.deepEqual(getStopUpdate(record), {
      replicas: 0,
      scaling_schedule: { ...schedule, paused: true }
    });
  });
}

test('a paused schedule resumes through a config update preserving its plan', () => {
  const record = {
    replicas: 0,
    scaling_schedule: { ...schedule, paused: true }
  };
  assert.equal(isSchedulePaused(record), true);
  assert.equal(canResumeDeployment(record), true);
  assert.equal(canPauseDeployment(record), false);
  assert.equal(isWaitingForSchedule(record), false);
  assert.deepEqual(getStartUpdate(record), {
    scaling_schedule: { ...schedule, paused: false }
  });
  assert.equal(record.scaling_schedule.paused, true);
});

for (const scaling_schedule of [
  undefined,
  null,
  { ...schedule, enabled: false, paused: true }
]) {
  test(`ordinary start and stop only update replicas (${String(scaling_schedule?.enabled)})`, () => {
    const stopped = { replicas: 0, scaling_schedule };
    const running = { replicas: 4, scaling_schedule };
    assert.deepEqual(getStartUpdate(stopped), { replicas: 1 });
    assert.deepEqual(getStartUpdate(running), { replicas: 4 });
    assert.deepEqual(getStopUpdate(running), { replicas: 0 });
    assert.equal(canResumeDeployment(stopped), true);
    assert.equal(canPauseDeployment(running), true);
    assert.equal(canPauseDeployment(stopped), false);
    assert.equal(canResumeDeployment(running), false);
    assert.equal(isSchedulePaused(stopped), false);
    assert.equal(isWaitingForSchedule(stopped), false);
  });
}

test('form targets preserve zero and use the configured schedule baseline', () => {
  assert.equal(getDeploymentFormReplicas({ replicas: 0 }), 0);
  assert.equal(
    getDeploymentFormReplicas({ replicas: 4, scaling_schedule: schedule }),
    0
  );
  assert.equal(getDeploymentFormReplicas({ replicas: 7 }), 7);
  assert.equal(getDeploymentFormReplicas(), 1);
});
