import type { ListItem } from '../config/types';

type ScalingRecord = Pick<ListItem, 'replicas' | 'scaling_schedule'>;

export const getReplicasUpdate = (record: ScalingRecord, replicas: number) => {
  const schedule = record.scaling_schedule;
  if (!schedule?.enabled) {
    return { replicas };
  }
  // Manual scaling sets the replica target until scheduling is enabled again.
  // Preserve the baseline and rules so enabling the plan restores its intent.
  return {
    replicas,
    scaling_schedule: { ...schedule, enabled: false, paused: false }
  };
};
