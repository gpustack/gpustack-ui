import { CronExpressionParser } from 'cron-parser';
import type { ScalingSchedule } from '../config/types';
import { getScalingSchedulePreviewCron } from './scaling-schedule-preview';

const CRONITER_ALIASES = new Set([
  '@midnight',
  '@hourly',
  '@daily',
  '@weekly',
  '@monthly',
  '@yearly',
  '@annually'
]);

export const canSaveScalingScheduleCron = (cron: string): boolean => {
  if (typeof cron !== 'string') return false;
  // Scheduled scaling supplies no hash_id to croniter. Preview support for
  // hashed fields therefore cannot make them valid deployment configuration.
  if (/\bh\b/i.test(cron)) return false;
  // croniter accepts these aliases without hashing even when no frontend
  // preview is available. Spaces around an alias are not accepted by croniter.
  if (CRONITER_ALIASES.has(cron.toLowerCase())) return true;
  const fields = cron.trim().split(/\s+/);
  if (
    fields.some(
      (field, index) =>
        field.includes('?') && (field !== '?' || (index !== 2 && index !== 4))
    )
  )
    return false;
  try {
    // Check ranges and reachable dates only after applying backend syntax
    // restrictions. Conversion is temporary; the stored expression is untouched.
    CronExpressionParser.parse(getScalingSchedulePreviewCron(cron)).next();
    return true;
  } catch {
    return false;
  }
};

const isReplicaCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

export const canSaveDisabledScalingSchedule = (
  schedule: ScalingSchedule,
  original?: ScalingSchedule | null
): boolean => {
  if (
    schedule.baseline_replicas != null &&
    !isReplicaCount(schedule.baseline_replicas)
  ) {
    return false;
  }
  return (schedule.rules || []).every((rule) => {
    if (!isReplicaCount(rule.replicas)) return false;
    if (
      rule.duration_seconds != null &&
      (!Number.isInteger(rule.duration_seconds) ||
        rule.duration_seconds <= 0 ||
        rule.duration_seconds > 366 * 24 * 3600)
    ) {
      return false;
    }
    // The server has already accepted stored expressions. A frontend parser
    // cannot invalidate them, even when another field in the rule was edited.
    return (
      rule.start_cron === '' ||
      !!original?.rules.some((saved) => saved.start_cron === rule.start_cron) ||
      canSaveScalingScheduleCron(rule.start_cron)
    );
  });
};

// Keep incomplete or known unsupported inputs visible. The server validates
// remaining cron syntax on submit, including dialects unavailable to preview.
export const canSubmitEnabledScalingSchedule = (
  schedule: ScalingSchedule
): boolean =>
  isReplicaCount(schedule.baseline_replicas) &&
  !!schedule.rules?.length &&
  schedule.rules.every(
    (rule) =>
      isReplicaCount(rule.replicas) &&
      Number.isInteger(rule.duration_seconds) &&
      rule.duration_seconds != null &&
      rule.duration_seconds > 0 &&
      rule.duration_seconds <= 366 * 24 * 3600 &&
      !!rule.start_cron?.trim() &&
      !/\bh\b/i.test(rule.start_cron)
  );
