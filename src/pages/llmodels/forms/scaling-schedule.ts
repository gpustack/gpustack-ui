import type { ScalingSchedule } from '../config/types';

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
  return config.enabled
    ? { ...config, baseline_replicas: replicas ?? 0 }
    : config;
};
