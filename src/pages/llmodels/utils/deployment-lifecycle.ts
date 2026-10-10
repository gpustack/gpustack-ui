import type { ListItem } from '../config/types';

type DeploymentLifecycle = Pick<ListItem, 'replicas' | 'scaling_schedule'>;

export const isSchedulePaused = (record: DeploymentLifecycle) =>
  !!record.scaling_schedule?.enabled && !!record.scaling_schedule.paused;

export const isWaitingForSchedule = (record: DeploymentLifecycle) =>
  !!record.scaling_schedule?.enabled &&
  !isSchedulePaused(record) &&
  record.replicas === 0;

export const canResumeDeployment = (record: DeploymentLifecycle) =>
  isSchedulePaused(record) ||
  (record.replicas === 0 && !record.scaling_schedule?.enabled);

export const canPauseDeployment = (record: DeploymentLifecycle) =>
  !isSchedulePaused(record) &&
  (record.replicas > 0 || !!record.scaling_schedule?.enabled);

export const getDeploymentFormReplicas = (
  record?: Partial<DeploymentLifecycle>
) => {
  if (record?.scaling_schedule?.enabled) {
    return record.scaling_schedule.baseline_replicas ?? record.replicas ?? 1;
  }
  return record?.replicas ?? 1;
};

export const getStartUpdate = (record: DeploymentLifecycle) =>
  record.scaling_schedule?.enabled
    ? { scaling_schedule: { ...record.scaling_schedule, paused: false } }
    : { replicas: record.replicas > 0 ? record.replicas : 1 };

export const getStopUpdate = (record: DeploymentLifecycle) =>
  record.scaling_schedule?.enabled
    ? {
        replicas: 0,
        scaling_schedule: { ...record.scaling_schedule, paused: true }
      }
    : { replicas: 0 };
