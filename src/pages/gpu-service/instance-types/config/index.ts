import { StatusMaps } from '@/config';
import { StatusType } from '@/config/types';
import { icons } from '@gpustack/core-ui';

// os is fixed to lowercase "linux" on the wire; the form only ever shows Linux.
export const GPU_INSTANCE_TYPE_OS = 'linux';

export const InstanceTypePhaseValueMap = {
  Active: 'Active',
  Inactive: 'Inactive',
  Preparing: 'Preparing'
};

export const InstanceTypePhaseLabelMap: Record<string, string> = {
  [InstanceTypePhaseValueMap.Active]: 'Active',
  [InstanceTypePhaseValueMap.Inactive]: 'Inactive',
  [InstanceTypePhaseValueMap.Preparing]: 'Preparing'
};

export const status: Record<string, StatusType> = {
  [InstanceTypePhaseValueMap.Active]: StatusMaps.success,
  [InstanceTypePhaseValueMap.Inactive]: StatusMaps.inactive,
  [InstanceTypePhaseValueMap.Preparing]: StatusMaps.transitioning
};

export const ArchOptions = [
  { label: 'amd64', value: 'amd64' },
  { label: 'arm64', value: 'arm64' }
];

// ``icon`` is narrowed to ``any`` so the inferred type doesn't reach into
// the antd icon component's internal path.
export const rowActionList: Array<{
  label: string;
  key: string;
  locale: boolean;
  icon: any;
  danger?: boolean;
}> = [
  {
    label: 'common.button.delete',
    key: 'delete',
    locale: true,
    icon: icons.DeleteOutlined,
    danger: true
  }
];
