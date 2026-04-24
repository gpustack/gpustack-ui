import { StatusMaps } from '@/config';
import { StatusType } from '@/config/types';
import { icons } from '@gpustack/core-ui';

export const StorageTypeValueMap = {
  Local: 'local',
  Shared: 'shared',
  Object: 'object'
};

export const StorageTypeLabelMap: Record<string, string> = {
  [StorageTypeValueMap.Local]: '默认存储',
  [StorageTypeValueMap.Shared]: '默认存储',
  [StorageTypeValueMap.Object]: '对象存储'
};

export const StorageAccessModeValueMap = {
  ReadWriteOnce: 'ReadWriteOnce',
  ReadOnlyMany: 'ReadOnlyMany',
  ReadWriteMany: 'ReadWriteMany'
};

export const StorageAccessModeOptions = [
  {
    label: 'ReadWriteOnce',
    value: StorageAccessModeValueMap.ReadWriteOnce
  },
  {
    label: 'ReadWriteMany',
    value: StorageAccessModeValueMap.ReadWriteMany
  },
  {
    label: 'ReadOnlyMany',
    value: StorageAccessModeValueMap.ReadOnlyMany
  }
];

export const StorageStatusValueMap = {
  Available: 'Available',
  Bound: 'Bound',
  Released: 'Released',
  Failed: 'Failed'
};

export const StorageStatusLabelMap: Record<string, string> = {
  [StorageStatusValueMap.Available]: 'Available',
  [StorageStatusValueMap.Bound]: 'Bound',
  [StorageStatusValueMap.Released]: 'Released',
  [StorageStatusValueMap.Failed]: 'Failed'
};

export const status: Record<string, StatusType> = {
  [StorageStatusValueMap.Available]: StatusMaps.success,
  [StorageStatusValueMap.Bound]: StatusMaps.transitioning,
  [StorageStatusValueMap.Released]: StatusMaps.inactive,
  [StorageStatusValueMap.Failed]: StatusMaps.error
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
