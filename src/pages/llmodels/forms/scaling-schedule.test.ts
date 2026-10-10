import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ScalingSchedule } from '../config/types';
import { getReplicasUpdate } from '../utils/manual-scaling';
import {
  getScalingSchedulePayload,
  hasScalingScheduleConfig
} from './scaling-schedule';

const schedule: ScalingSchedule = {
  enabled: true,
  baseline_replicas: 2,
  rules: [
    {
      start_cron: '0 9 * * *',
      duration_seconds: 28800,
      replicas: 3,
      name: 'daytime'
    }
  ]
};

test('a deployment switched to manual scaling retains its disabled plan through both form submission stages', () => {
  const stopped = getReplicasUpdate(
    { replicas: 3, scaling_schedule: schedule },
    0
  );
  const formPayload = getScalingSchedulePayload(stopped.scaling_schedule, 0);
  const editPayload = getScalingSchedulePayload(formPayload, 0);
  assert.deepEqual(editPayload, { ...schedule, enabled: false });
  assert.equal(hasScalingScheduleConfig(editPayload), true);
  assert.equal(schedule.enabled, true);
});

test('editing a manual target leaves the saved baseline and rules intact', () => {
  const disabled = { ...schedule, enabled: false };
  assert.deepEqual(getScalingSchedulePayload(disabled, 8), disabled);
});

test('an enabled plan submits the top replica value as its baseline', () => {
  assert.deepEqual(getScalingSchedulePayload(schedule, 5), {
    ...schedule,
    baseline_replicas: 5
  });
  assert.equal(schedule.baseline_replicas, 2);
});

for (const empty of [undefined, null, { enabled: false, rules: [] }]) {
  test(`a deployment with no saved plan submits null (${String(empty)})`, () => {
    assert.equal(getScalingSchedulePayload(empty, 1), null);
    assert.equal(hasScalingScheduleConfig(empty), false);
  });
}

test('a disabled plan preserves a zero baseline even without rules', () => {
  const disabled = { enabled: false, baseline_replicas: 0, rules: [] };
  assert.deepEqual(getScalingSchedulePayload(disabled, 5), disabled);
  assert.equal(hasScalingScheduleConfig(disabled), true);
});

test('disabled drafts retain schema-compatible incomplete rules before activation', () => {
  const draft = {
    enabled: false,
    rules: [{ start_cron: '', duration_seconds: null, replicas: 1 }]
  };
  assert.deepEqual(getScalingSchedulePayload(draft, 5), draft);
  assert.equal(hasScalingScheduleConfig(draft), true);
});

for (const invalid of [
  { start_cron: 'invalid cron', replicas: null },
  { start_cron: '0 0 30 2 *', replicas: -1 },
  { replicas: 1.5, duration_seconds: 0 },
  { replicas: undefined, duration_seconds: 367 * 24 * 3600 }
]) {
  test(`disabled plans normalize hidden invalid values (${JSON.stringify(invalid)})`, () => {
    const draft = {
      ...schedule,
      enabled: false,
      rules: [{ ...schedule.rules[0], ...invalid }]
    } as ScalingSchedule;
    const config = getScalingSchedulePayload(draft, 5)!;
    assert.equal(config.enabled, false);
    assert.equal(config.baseline_replicas, 2);
    assert.equal(config.rules[0].replicas, 0);
    assert.equal(config.rules[0].name, 'daytime');
    assert.equal(
      config.rules[0].start_cron,
      invalid.start_cron ? '' : schedule.rules[0].start_cron
    );
    assert.equal(
      config.rules[0].duration_seconds,
      'duration_seconds' in invalid ? null : 28800
    );
    assert.deepEqual(getScalingSchedulePayload(config, 5), config);
    assert.deepEqual(draft.rules[0], { ...schedule.rules[0], ...invalid });
    assert.deepEqual(
      getScalingSchedulePayload({ ...draft, enabled: true }, 5)?.rules,
      draft.rules
    );
  });
}

for (const paused of [true, false]) {
  test(`configuration payload excludes schedule execution state (${paused})`, () => {
    const config = getScalingSchedulePayload({ ...schedule, paused }, 2);
    assert.deepEqual(config, schedule);
  });
}
