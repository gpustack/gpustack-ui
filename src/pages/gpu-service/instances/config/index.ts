import { StatusMaps } from '@/config';
import { StatusType } from '@/config/types';
import { icons } from '@gpustack/core-ui';

export const InstanceStatusValueMap = {
  Ready: 'ready',
  Pending: 'pending',
  Error: 'error'
};

export const InstanceStatusLabelMap: Record<string, string> = {
  [InstanceStatusValueMap.Ready]: 'Ready',
  [InstanceStatusValueMap.Pending]: 'Pending',
  [InstanceStatusValueMap.Error]: 'Error'
};

export const status: Record<string, StatusType> = {
  [InstanceStatusValueMap.Ready]: StatusMaps.success,
  [InstanceStatusValueMap.Pending]: StatusMaps.transitioning,
  [InstanceStatusValueMap.Error]: StatusMaps.error
};

export const rowActionList = [
  {
    label: '编辑',
    key: 'edit',
    icon: icons.EditOutlined
  },
  {
    label: '删除',
    key: 'delete',
    icon: icons.DeleteOutlined,
    props: {
      danger: true
    }
  }
];

export const InstanceTypePhaseValueMap = {
  Available: 'Available',
  Unavailable: 'Unavailable'
};

export const StorageModeValueMap = {
  Existing: 'existing',
  Temporary: 'temporary'
};

// Constant SSH public key resource name used when SSH is enabled
export const DEFAULT_SSH_PUBLIC_KEY_NAME = 'default';
