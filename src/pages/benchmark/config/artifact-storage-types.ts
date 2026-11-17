export interface ArtifactStorageCapacity {
  max_bytes: number;
  unlimited: boolean;
  used_bytes: number;
  remaining_bytes: number | null;
  usage_percent: number | null;
  state: 'unlimited' | 'normal' | 'warning' | 'full';
  warning_threshold_percent: number;
}
