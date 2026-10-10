import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ScalingSchedule } from '../config/types';
import { getReplicasUpdate } from './manual-scaling';

const schedule: ScalingSchedule = {
  enabled: true,
  baseline_replicas: 2,
  rules: [{ start_cron: '0 9 * * *', duration_seconds: 28800, replicas: 3 }]
};

for (const replicas of [0, 1, 5]) {
  test(`manual scaling to ${replicas} disables the plan and preserves its configuration`, () => {
    const record = { replicas: 3, scaling_schedule: schedule };
    const update = getReplicasUpdate(record, replicas);
    assert.equal(update.replicas, replicas);
    assert.deepEqual(update.scaling_schedule, {
      ...schedule,
      enabled: false,
      paused: false
    });
    assert.equal(record.scaling_schedule.enabled, true);
    assert.equal(record.scaling_schedule.baseline_replicas, 2);
  });
}

for (const scaling_schedule of [
  undefined,
  null,
  { ...schedule, enabled: false }
]) {
  test(`manual scaling without an enabled plan changes only replicas (${String(scaling_schedule?.enabled)})`, () => {
    assert.deepEqual(getReplicasUpdate({ replicas: 3, scaling_schedule }, 0), {
      replicas: 0
    });
  });
}
