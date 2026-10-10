import { CronExpressionParser } from 'cron-parser';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ScalingSchedule } from '../config/types';
import { getReplicasUpdate } from '../utils/manual-scaling';
import {
  getScalingSchedulePayload,
  hasScalingScheduleConfig
} from './scaling-schedule';
import {
  canPreviewScalingScheduleCron,
  getScalingSchedulePreviewCron
} from './scaling-schedule-preview';
import {
  canSaveDisabledScalingSchedule,
  canSaveScalingScheduleCron,
  canSubmitEnabledScalingSchedule
} from './scaling-schedule-validation';

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
  { start_cron: '0 9 * * 5L' },
  { replicas: 1.5, duration_seconds: 0 },
  { replicas: undefined, duration_seconds: 367 * 24 * 3600 }
]) {
  test(`unconfirmed drafts require an explicit decision without altering fields (${JSON.stringify(invalid)})`, () => {
    const draft = {
      ...schedule,
      enabled: false,
      rules: [{ ...schedule.rules[0], ...invalid }]
    } as ScalingSchedule;
    const config = getScalingSchedulePayload(draft, 5)!;
    assert.equal(config.enabled, false);
    assert.equal(config.baseline_replicas, 2);
    assert.deepEqual(config, draft);
    assert.equal(canSaveDisabledScalingSchedule(draft, schedule), false);
    assert.deepEqual(getScalingSchedulePayload(config, 5), config);
    assert.deepEqual(draft.rules[0], { ...schedule.rules[0], ...invalid });
    assert.deepEqual(
      getScalingSchedulePayload({ ...draft, enabled: true }, 5)?.rules,
      draft.rules
    );
  });
}

for (const cron of ['0 9 * * * 30', '0 9 * * L5', '@daily']) {
  test(`saved cron survives both submission stages and enabling (${cron})`, () => {
    const original = {
      ...schedule,
      enabled: false,
      rules: [{ ...schedule.rules[0], start_cron: cron }]
    };
    const config = getScalingSchedulePayload(original, 5)!;
    assert.deepEqual(getScalingSchedulePayload(config, 5), original);
    assert.equal(canSaveDisabledScalingSchedule(config, original), true);
    assert.deepEqual(
      getScalingSchedulePayload({ ...config, enabled: true }, 2)?.rules,
      original.rules
    );
    assert.equal(original.rules[0].start_cron, cron);
  });
}

for (const [cron, expected] of [
  ['0 9 * * * 30', '2026-10-12T09:00:30.000Z'],
  ['0 9 * * L5', '2026-10-30T09:00:00.000Z']
]) {
  test(`preview follows backend seconds and weekday semantics (${cron})`, () => {
    assert.equal(
      CronExpressionParser.parse(getScalingSchedulePreviewCron(cron), {
        tz: 'UTC',
        currentDate: '2026-10-12T00:00:00Z'
      })
        .next()
        .toISOString(),
      expected
    );
    assert.equal(canPreviewScalingScheduleCron(cron), true);
  });
}

test('an unavailable preview cannot invalidate an unchanged saved expression', () => {
  const original = {
    ...schedule,
    rules: [{ ...schedule.rules[0], start_cron: '@daily' }]
  };
  assert.equal(canPreviewScalingScheduleCron('@daily'), false);
  assert.equal(canSaveDisabledScalingSchedule(original, original), true);
  assert.equal(canSaveDisabledScalingSchedule(original, null), true);
});

for (const cron of [
  'H 9 * * *',
  'H(1-10) 9 * * *',
  'H/5 9 * * *',
  '0 9 * * * H'
]) {
  test(`a previewable hash expression cannot be submitted without a hash id (${cron})`, () => {
    assert.equal(canPreviewScalingScheduleCron(cron), true);
    assert.equal(canSaveScalingScheduleCron(cron), false);
    const draft = {
      ...schedule,
      enabled: false,
      rules: [{ ...schedule.rules[0], start_cron: cron }]
    };
    assert.equal(canSaveDisabledScalingSchedule(draft, schedule), false);
    assert.equal(draft.rules[0].start_cron, cron);
  });
}

for (const cron of [
  '@midnight',
  '@hourly',
  '@daily',
  '@weekly',
  '@monthly',
  '@yearly',
  '@annually',
  '@DAILY'
]) {
  test(`backend aliases can be saved independently of preview (${cron})`, () => {
    assert.equal(canPreviewScalingScheduleCron(cron), false);
    assert.equal(canSaveScalingScheduleCron(cron), true);
    const draft = {
      ...schedule,
      rules: [{ ...schedule.rules[0], start_cron: cron }]
    };
    assert.equal(canSaveDisabledScalingSchedule(draft, null), true);
    assert.equal(canSubmitEnabledScalingSchedule(draft), true);
    assert.equal(
      getScalingSchedulePayload(draft, 2)?.rules[0].start_cron,
      cron
    );
  });
}

for (const cron of [' @daily ', '0 9 * * 5L', '? 9 * * *', '0 0 30 2 *']) {
  test(`backend-incompatible drafts cannot be saved (${cron})`, () => {
    assert.equal(canSaveScalingScheduleCron(cron), false);
  });
}

test('unchanged saved syntax remains intact when local validation cannot confirm it', () => {
  const original = {
    ...schedule,
    enabled: false,
    rules: [{ ...schedule.rules[0], start_cron: 'R 9 * * *' }]
  };
  assert.equal(canSaveScalingScheduleCron(original.rules[0].start_cron), false);
  assert.equal(
    canSubmitEnabledScalingSchedule({ ...original, enabled: true }),
    true
  );
  assert.equal(canSaveDisabledScalingSchedule(original, original), true);
  assert.deepEqual(getScalingSchedulePayload(original, 2), original);
});

for (const incomplete of [
  { replicas: null },
  { duration_seconds: null },
  { start_cron: '' }
]) {
  test(`enabled plans cannot submit incomplete rules (${JSON.stringify(incomplete)})`, () => {
    const draft = {
      ...schedule,
      rules: [{ ...schedule.rules[0], ...incomplete }]
    } as ScalingSchedule;
    assert.equal(canSubmitEnabledScalingSchedule(draft), false);
  });
}

for (const paused of [true, false]) {
  test(`configuration payload excludes schedule execution state (${paused})`, () => {
    const config = getScalingSchedulePayload({ ...schedule, paused }, 2);
    assert.deepEqual(config, schedule);
  });
}
