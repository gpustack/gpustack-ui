import { StatusMaps } from '@/config';
import { StatusType } from '@/config/types';
import { icons } from '@gpustack/core-ui';
import _ from 'lodash';
import {
  InstanceTypeItem,
  InstanceTypeResource,
  InstanceTypeStatus
} from './types';

export const InstanceStatusValueMap = {
  Scheduling: 'Scheduling',
  Pending: 'Pending',
  Scheduled: 'Scheduled',
  Initializing: 'Initializing',
  InitializeFailed: 'InitializeFailed',
  Initialized: 'Initialized',
  Preparing: 'Preparing',
  NotReady: 'NotReady',
  Ready: 'Ready'
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
  [InstanceStatusValueMap.Ready]: 'Ready'
};

export const status: Record<string, StatusType> = {
  [InstanceStatusValueMap.Scheduling]: StatusMaps.transitioning,
  [InstanceStatusValueMap.Pending]: StatusMaps.transitioning,
  [InstanceStatusValueMap.Scheduled]: StatusMaps.transitioning,
  [InstanceStatusValueMap.Initializing]: StatusMaps.transitioning,
  [InstanceStatusValueMap.InitializeFailed]: StatusMaps.error,
  [InstanceStatusValueMap.Initialized]: StatusMaps.transitioning,
  [InstanceStatusValueMap.Preparing]: StatusMaps.transitioning,
  [InstanceStatusValueMap.NotReady]: StatusMaps.warning,
  [InstanceStatusValueMap.Ready]: StatusMaps.success
};

export const rowActionList = [
  {
    label: 'common.button.edit',
    key: 'edit',
    locale: true,
    icon: icons.EditOutlined
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
  // Available: 'Available',
  // Unavailable: 'Unavailable'
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
  Existing: 'existing',
  Temporary: 'temporary'
};

// Constant SSH public key resource name used when SSH is enabled
export const DEFAULT_SSH_PUBLIC_KEY_NAME = 'default';

const KI_TO_GI = 1024 * 1024;

export const convertKiToGi = (value?: string): string | undefined => {
  if (!value) return value;
  const match = /^(-?\d+(?:\.\d+)?)Ki$/.exec(value);
  if (!match) return value;
  return `${_.round(Number(match[1]) / KI_TO_GI, 2)}Gi`;
};

export const transformInstanceTypeResource = (
  resource?: InstanceTypeResource
): InstanceTypeResource | undefined => {
  if (!resource) return resource;
  return {
    ...resource,
    capacity: convertKiToGi(
      resource.capacity
    ) as InstanceTypeResource['capacity'],
    onceMaxRequest: convertKiToGi(
      resource.onceMaxRequest
    ) as InstanceTypeResource['onceMaxRequest'],
    remaining: convertKiToGi(
      resource.remaining
    ) as InstanceTypeResource['remaining']
  };
};

export const transformInstanceType = (
  item: InstanceTypeItem
): InstanceTypeItem => {
  if (!item?.status) return item;
  const status = item.status;
  return {
    ...item,
    status: {
      ...status,
      accelerator: transformInstanceTypeResource(
        status.accelerator
      ) as InstanceTypeStatus['accelerator'],
      cpu: transformInstanceTypeResource(
        status.cpu
      ) as InstanceTypeStatus['cpu'],
      localStorage: transformInstanceTypeResource(
        status.localStorage
      ) as InstanceTypeStatus['localStorage'],
      ram: transformInstanceTypeResource(
        status.ram
      ) as InstanceTypeStatus['ram']
    }
  };
};
