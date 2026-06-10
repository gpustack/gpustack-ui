import { StatusMaps } from '@/config';
import { StatusType } from '@/config/types';
import { IconFont, icons } from '@gpustack/core-ui';
import _ from 'lodash';
import React from 'react';
import { ListItem } from '../config/types';

export const InstanceStatusValueMap = {
  Scheduling: 'Scheduling',
  Pending: 'Pending',
  Scheduled: 'Scheduled',
  Initializing: 'Initializing',
  InitializeFailed: 'InitializeFailed',
  Initialized: 'Initialized',
  Preparing: 'Preparing',
  NotReady: 'NotReady',
  Ready: 'Ready',
  Starting: 'Starting',
  Deleting: 'Deleting',
  Stopping: 'Stopping',
  Stopped: 'Stopped',
  CreateFailed: 'CreateFailed',
  SSHPublicKeyCreateFailed: 'SSHPublicKeyCreateFailed',
  PersistentVolumeTypeCreateFailed: 'PersistentVolumeTypeCreateFailed',
  PersistentVolumeCreateFailed: 'PersistentVolumeCreateFailed',
  Unknown: 'Unknown'
};

export const K8SStatuses = [
  InstanceStatusValueMap.Scheduling,
  InstanceStatusValueMap.Pending,
  InstanceStatusValueMap.Scheduled,
  InstanceStatusValueMap.Initializing,
  InstanceStatusValueMap.InitializeFailed,
  InstanceStatusValueMap.Initialized,
  InstanceStatusValueMap.Preparing,
  InstanceStatusValueMap.NotReady,
  InstanceStatusValueMap.Ready
];

export const GPUStackFailedStatuses = [
  InstanceStatusValueMap.CreateFailed,
  InstanceStatusValueMap.SSHPublicKeyCreateFailed,
  InstanceStatusValueMap.PersistentVolumeTypeCreateFailed,
  InstanceStatusValueMap.PersistentVolumeCreateFailed
];

export const InstanceStatusLabelMap: Record<string, string> = {
  // === K8s Statuses ===
  ...Object.fromEntries(K8SStatuses.map((status) => [status, status])),
  // === GPUStack Statuses no logs and events===
  [InstanceStatusValueMap.Deleting]: 'Deleting',
  [InstanceStatusValueMap.Stopping]: 'Stopping',
  [InstanceStatusValueMap.Stopped]: 'Stopped',
  [InstanceStatusValueMap.Unknown]: 'Unknown',
  [InstanceStatusValueMap.Starting]: 'Starting',
  ...Object.fromEntries(
    GPUStackFailedStatuses.map((status) => [status, status])
  )
};

export const status: Record<string, StatusType> = {
  [InstanceStatusValueMap.Scheduling]: StatusMaps.transitioning,
  [InstanceStatusValueMap.Pending]: StatusMaps.transitioning,
  [InstanceStatusValueMap.Scheduled]: StatusMaps.transitioning,
  [InstanceStatusValueMap.Initializing]: StatusMaps.transitioning,
  [InstanceStatusValueMap.InitializeFailed]: StatusMaps.error,
  [InstanceStatusValueMap.Initialized]: StatusMaps.transitioning,
  [InstanceStatusValueMap.Preparing]: StatusMaps.transitioning,
  [InstanceStatusValueMap.NotReady]: StatusMaps.error,
  [InstanceStatusValueMap.Ready]: StatusMaps.success,
  [InstanceStatusValueMap.Starting]: StatusMaps.transitioning,
  [InstanceStatusValueMap.Deleting]: StatusMaps.error,
  [InstanceStatusValueMap.Stopping]: StatusMaps.error,
  [InstanceStatusValueMap.Stopped]: StatusMaps.warning,
  [InstanceStatusValueMap.CreateFailed]: StatusMaps.error,
  [InstanceStatusValueMap.SSHPublicKeyCreateFailed]: StatusMaps.error,
  [InstanceStatusValueMap.PersistentVolumeTypeCreateFailed]: StatusMaps.error,
  [InstanceStatusValueMap.PersistentVolumeCreateFailed]: StatusMaps.error,
  [InstanceStatusValueMap.Unknown]: StatusMaps.error
};

export interface InstanceRowAction {
  label: string;
  key: string;
  locale?: boolean;
  icon?: React.ReactNode;
  props?: Record<string, any>;
  show?: (record: ListItem) => boolean;
  disabled?: (record: ListItem) => boolean;
}

export const rowActionList: InstanceRowAction[] = [
  {
    label: 'common.button.edit',
    key: 'edit',
    locale: true,
    icon: icons.EditOutlined
  },
  {
    label: 'common.button.viewlog',
    key: 'viewlog',
    locale: true,
    icon: React.createElement(IconFont, { type: 'icon-logs' }),
    show: (record: ListItem) => {
      const phase = record.status?.phase;
      return [InstanceStatusValueMap.Ready].includes(phase as string);
    }
  },
  {
    label: 'common.button.viewevent',
    key: 'viewevent',
    locale: true,
    icon: icons.ProfileOutlined,
    show: (record: ListItem) => {
      const phase = record.status?.phase;
      return [...K8SStatuses, InstanceStatusValueMap.Starting].includes(
        phase as string
      );
    }
  },
  {
    label: 'common.button.start',
    key: 'start',
    locale: true,
    icon: icons.Play,
    props: {
      disabled: false
    },
    show: (record: ListItem) => {
      const phase = record.status?.phase;
      return [InstanceStatusValueMap.Stopped].includes(phase as string);
    }
  },
  {
    label: 'common.button.stop',
    key: 'stop',
    locale: true,
    icon: icons.Stop,
    props: {
      disabled: false
    },
    show: (record: ListItem) => {
      const phase = record.status?.phase;
      return [InstanceStatusValueMap.Ready].includes(phase as string);
    }
  },
  {
    label: 'common.button.delete',
    key: 'delete',
    locale: true,
    icon: icons.DeleteOutlined,
    show: (record: ListItem) => {
      const phase = record.status?.phase;
      return true;
    },
    props: {
      danger: true
    }
  }
];

export const batchActionList = [
  {
    label: 'common.button.start',
    key: 'start',
    locale: true,
    icon: icons.Play
  },
  {
    label: 'common.button.stop',
    key: 'stop',
    locale: true,
    icon: icons.Stop
  },
  {
    label: 'common.button.delete',
    key: 'delete',
    locale: true,
    icon: icons.DeleteOutlined,
    props: {
      danger: true
    }
  }
];

export const InstanceTypePhaseValueMap = {
  PreParing: 'Preparing',
  Inactive: 'Inactive',
  Active: 'Active'
};

export const InstanceTypePhaseLabelMap: Record<string, string> = {
  [InstanceTypePhaseValueMap.PreParing]: 'Preparing',
  [InstanceTypePhaseValueMap.Inactive]: 'Inactive',
  [InstanceTypePhaseValueMap.Active]: 'Active'
};

export const InstanceTypePhaseStatus: Record<string, StatusType> = {
  [InstanceTypePhaseValueMap.PreParing]: StatusMaps.transitioning,
  [InstanceTypePhaseValueMap.Inactive]: StatusMaps.inactive,
  [InstanceTypePhaseValueMap.Active]: StatusMaps.success
};

export const StorageModeValueMap = {
  Temporary: 'temporary',
  Persistent: 'persistent'
};

export const DEFAULT_PV_CAPACITY_GB = 20;

// Constant SSH public key resource name used when SSH is enabled
export const DEFAULT_SSH_PUBLIC_KEY_NAME = 'default';

const GI_DIVISOR: Record<string, number> = {
  Ki: 1024 * 1024,
  Mi: 1024,
  Gi: 1
};

export const convertKiToGi = (value?: string): string | undefined => {
  if (!value) return value;
  const match = /^(-?\d+(?:\.\d+)?)(Ki|Mi|Gi|Ti)$/.exec(value);
  if (!match) return value;
  const [, num, unit] = match;
  if (unit === 'Ti') return `${_.floor(Number(num), 0)} Ti`;
  return `${_.floor(Number(num) / GI_DIVISOR[unit], 0)} Gi`;
};

// Memory quantity → display string, flooring to whole Gi. Accepts a k8s
// quantity string ("16Gi" / "32607Mi") or a raw MiB number (as the Usage
// breakdown carries it). Centralizes the conversion so the GPU Instances list
// and the Usage tab render identical sizes (e.g. both "31GB", not 31 vs 32).
export const formatMemoryDisplay = (
  value?: string | number
): string | undefined => {
  if (!value) return undefined;
  const quantity = typeof value === 'number' ? `${value}Mi` : value;
  return (
    convertKiToGi(quantity)?.replace(/Gi$/, 'GB').replace(/Ti$/, 'TB') ||
    undefined
  );
};

const parseQuantity = (value?: string | null): number => {
  if (!value) return 0;
  const match = /^(-?\d+(?:\.\d+)?)/.exec(String(value));
  return match ? Number(match[1]) || 0 : 0;
};

// Returns the slider max for the accelerator count: the largest
// tier.onceMaxRequest.accelerator across all tiers (not from candidates).
export const getAcceleratorMax = (
  tiers?: { onceMaxRequest: { accelerator?: string } }[] | null
) => {
  if (!tiers?.length) return 0;
  return tiers.reduce((acc, tier) => {
    const n = parseQuantity(tier.onceMaxRequest?.accelerator);
    return n > acc ? n : acc;
  }, 0);
};

// Picks the candidate (cluster + type name) that should fulfill a requested
// accelerator count: the first candidate of the smallest tier whose
// onceMaxRequest.accelerator is >= the requested count and whose cpu/ram/localStorage
// remaining are all > 0.
export const pickCandidateForAccelerator = <
  C extends {
    cluster: string;
    name: string;
    cpu?: { remaining?: string | null } | null;
    ram?: { remaining?: string | null } | null;
    localStorage?: { remaining?: string | null } | null;
  }
>(
  tiers:
    | {
        onceMaxRequest: { accelerator?: string };
        candidates?: C[] | null;
      }[]
    | undefined
    | null,
  { count, acceleratable }: { count: number; acceleratable?: boolean }
): C | null => {
  if (!tiers?.length) return null;

  const hasResources = (c: C) =>
    parseQuantity(c.cpu?.remaining) > 0 &&
    parseQuantity(c.ram?.remaining) > 0 &&
    parseQuantity(c.localStorage?.remaining) > 0;

  const sorted = [...tiers].sort(
    (a, b) =>
      parseQuantity(a.onceMaxRequest?.accelerator) -
      parseQuantity(b.onceMaxRequest?.accelerator)
  );

  // count === 0 ? parseQuantity(tier.onceMaxRequest.accelerator) > count; this is CPU-only case.
  for (const tier of sorted) {
    const acceleratorCount = parseQuantity(tier.onceMaxRequest?.accelerator);
    const fits = acceleratable
      ? acceleratorCount >= count
      : acceleratorCount === 0;
    if (!fits) continue;
    const candidate = tier.candidates?.find(hasResources);
    if (candidate) return candidate;
  }
  return null;
};
