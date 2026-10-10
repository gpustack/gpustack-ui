import { CronExpressionParser } from 'cron-parser';
import type { ScalingSchedule } from '../config/types';

const normalizeDisabledCron = (cron: string): string => {
  if (!cron?.trim()) return '';
  try {
    CronExpressionParser.parse(cron).next();
    return cron;
  } catch {
    return '';
  }
};

const isReplicaCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

export const hasScalingScheduleConfig = (
  schedule?: ScalingSchedule | null
): boolean => {
  return !!(
    schedule?.enabled ||
    schedule?.baseline_replicas != null ||
    schedule?.rules?.length
  );
};

export const getScalingSchedulePayload = (
  schedule: ScalingSchedule | null | undefined,
  replicas: number | null | undefined
): ScalingSchedule | null => {
  if (!schedule || !hasScalingScheduleConfig(schedule)) {
    return null;
  }
  // The top replica field owns the baseline only while the plan is enabled.
  // In manual mode it controls the live target without changing the saved plan.
  const config = { ...schedule };
  // Configuration saves preserve execution state on the server, so a stale
  // form cannot resume a plan that was paused after the form opened.
  delete config.paused;
  if (config.enabled) {
    return { ...config, baseline_replicas: replicas ?? 0 };
  }
  // Hidden fields skip form validation. Disabled plans accept incomplete
  // windows, but their individual fields must still satisfy the API schema.
  return {
    ...config,
    ...(config.baseline_replicas != null &&
    !isReplicaCount(config.baseline_replicas)
      ? { baseline_replicas: null }
      : {}),
    rules: (config.rules || []).map((rule) => ({
      ...rule,
      start_cron: normalizeDisabledCron(rule.start_cron),
      replicas: isReplicaCount(rule.replicas) ? rule.replicas : 0,
      ...(rule.duration_seconds != null &&
      (!Number.isInteger(rule.duration_seconds) ||
        rule.duration_seconds <= 0 ||
        rule.duration_seconds > 366 * 24 * 3600)
        ? { duration_seconds: null }
        : {})
    }))
  };
};
