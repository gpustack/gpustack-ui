import { StatusMaps } from '@/config';
import { StatusType } from '@/config/types';
import { icons } from '@gpustack/core-ui';
import { InstanceItem } from './types';

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

export const InstanceTypeStatusValueMap = {
  Available: 'available',
  Unavailable: 'unavailable'
};

export const instanceTypeOptions: InstanceItem[] = [
  {
    id: 1,
    name: 'NVIDIA L4 Small',
    vram: 24,
    ram: 64,
    vCPU: 16,
    gpu_count: 1,
    status: InstanceTypeStatusValueMap.Available
  },
  {
    id: 2,
    name: 'NVIDIA A100 Training',
    vram: 80,
    ram: 256,
    vCPU: 64,
    gpu_count: 8,
    status: InstanceTypeStatusValueMap.Available
  },
  {
    id: 3,
    name: 'NVIDIA H100 Inference',
    vram: 80,
    ram: 512,
    vCPU: 96,
    gpu_count: 0,
    status: InstanceTypeStatusValueMap.Unavailable
  }
];

export const StorageModeValueMap = {
  Existing: 'existing',
  Temporary: 'temporary'
};
