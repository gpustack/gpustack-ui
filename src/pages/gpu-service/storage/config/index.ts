import { StatusMaps } from '@/config';
import { StatusType } from '@/config/types';
import { icons } from '@gpustack/core-ui';

export const StoragePhaseValueMap = {
  Available: 'Available',
  Unavailable: 'Unavailable',
  Pending: 'Pending'
};

export const StoragePhaseLabelMap: Record<string, string> = {
  [StoragePhaseValueMap.Available]: 'Available',
  [StoragePhaseValueMap.Unavailable]: 'Unavailable',
  [StoragePhaseValueMap.Pending]: 'Pending'
};

export const status: Record<string, StatusType> = {
  [StoragePhaseValueMap.Available]: StatusMaps.success,
  [StoragePhaseValueMap.Unavailable]: StatusMaps.error,
  [StoragePhaseValueMap.Pending]: StatusMaps.transitioning
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
