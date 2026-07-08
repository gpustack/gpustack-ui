import { StatusMaps } from '@/config';
import { StatusType } from '@/config/types';
import { icons } from '@gpustack/core-ui';

export const StoragePhaseValueMap = {
  Ready: 'Ready',
  Deleting: 'Deleting'
};

export const StoragePhaseLabelMap: Record<string, string> = {
  [StoragePhaseValueMap.Ready]: 'Ready',
  [StoragePhaseValueMap.Deleting]: 'Deleting'
};

export const status: Record<string, StatusType> = {
  [StoragePhaseValueMap.Ready]: StatusMaps.success,
  [StoragePhaseValueMap.Deleting]: StatusMaps.warning
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
