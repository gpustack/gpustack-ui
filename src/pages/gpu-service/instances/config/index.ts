import { StatusMaps } from '@/config';
import { StatusType } from '@/config/types';
import { IconFont, icons } from '@gpustack/core-ui';
import _ from 'lodash';
import React from 'react';

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
  Staring: 'Staring'
};

export const InstanceStatusLabelMap: Record<string, string> = {
  [InstanceStatusValueMap.Scheduling]: 'Scheduling',
  [InstanceStatusValueMap.Pending]: 'Pending',
  [InstanceStatusValueMap.Scheduled]: 'Scheduled',
  [InstanceStatusValueMap.Initializing]: 'Initializing',
  [InstanceStatusValueMap.InitializeFailed]: 'InitializeFailed',
  [InstanceStatusValueMap.Initialized]: 'Initialized',
  [InstanceStatusValueMap.Preparing]: 'Preparing',
  [InstanceStatusValueMap.NotReady]: 'NotReady',
  [InstanceStatusValueMap.Ready]: 'Ready',
  [InstanceStatusValueMap.Staring]: 'Staring'
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
  [InstanceStatusValueMap.Staring]: StatusMaps.transitioning
};

// Lifecycle actions (logs/events/start/stop) require K8s proxy endpoints that
// the new /v2/gpu-instances API does not yet expose; keep them visible but
// disabled until backend support lands.
export const rowActionList = [
  {
    label: 'common.button.edit',
    key: 'edit',
    locale: true,
    icon: icons.EditOutlined
  },
  // {
  //   label: 'common.button.view',
  //   key: 'view',
  //   locale: true,
  //   icon: icons.DetailInfo
  // },
  {
    label: 'common.button.viewlog',
    key: 'viewlog',
    locale: true,
    icon: React.createElement(IconFont, { type: 'icon-logs' })
  },
  {
    label: 'common.button.viewevent',
    key: 'viewevent',
    locale: true,
    icon: icons.ProfileOutlined
  },
  // {
  //   label: 'common.button.start',
  //   key: 'start',
  //   locale: true,
  //   icon: icons.Play,
  //   props: {
  //     disabled: true
  //   }
  // },
  // {
  //   label: 'common.button.stop',
  //   key: 'stop',
  //   locale: true,
  //   icon: icons.Stop,
  //   props: {
  //     disabled: true
  //   }
  // },
  // {
  //   label: 'common.button.recreate',
  //   key: 'recreate',
  //   locale: true,
  //   icon: icons.RetweetOutlined
  // },
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

export const batchActionList = [
  {
    label: 'common.button.start',
    key: 'start',
    icon: icons.Play,
    props: {
      disabled: true
    }
  },
  {
    label: 'common.button.stop',
    key: 'stop',
    icon: icons.Stop,
    props: {
      disabled: true
    }
  },
  {
    label: 'common.button.delete',
    key: 'delete',
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
  if (unit === 'Ti') return `${_.round(Number(num), 2)}Ti`;
  return `${_.round(Number(num) / GI_DIVISOR[unit], 2)}Gi`;
};

const parseQuantity = (value?: string | null): number => {
  if (!value) return 0;
  const match = /^(-?\d+(?:\.\d+)?)/.exec(String(value));
  return match ? Number(match[1]) || 0 : 0;
};

// Returns the slider max for the accelerator count: the largest
// tier.onceMaxRequest across all acceleratorTiers (not from candidates).
export const getAcceleratorMax = (
  tiers?: { onceMaxRequest: string }[] | null
) => {
  if (!tiers?.length) return 0;
  return tiers.reduce((acc, tier) => {
    const n = parseQuantity(tier.onceMaxRequest);
    return n > acc ? n : acc;
  }, 0);
};

// Picks the candidate (cluster + type name) that should fulfill a requested
// accelerator count: the first candidate of the smallest tier whose
// onceMaxRequest is >= the requested count.
export const pickCandidateForAccelerator = <
  C extends { cluster: string; name: string }
>(
  tiers:
    | { onceMaxRequest: string; candidates?: C[] | null }[]
    | undefined
    | null,
  count: number
): C | null => {
  if (!tiers?.length) return null;
  const sorted = [...tiers].sort(
    (a, b) => parseQuantity(a.onceMaxRequest) - parseQuantity(b.onceMaxRequest)
  );
  const tier = sorted.find((t) =>
    count === 0
      ? parseQuantity(t.onceMaxRequest) > count
      : parseQuantity(t.onceMaxRequest) >= count
  );
  return tier?.candidates?.[0] ?? null;
};
