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
  Starting: 'Starting'
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
  [InstanceStatusValueMap.Starting]: 'Starting'
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
  [InstanceStatusValueMap.Starting]: StatusMaps.transitioning
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
// tier.onceMaxRequest.accelerator across all acceleratorTiers (not from candidates).
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
  count: number
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
    const fits = parseQuantity(tier.onceMaxRequest?.accelerator) >= count;
    if (!fits) continue;
    const candidate = tier.candidates?.find(hasResources);
    if (candidate) return candidate;
  }
  return null;
};
