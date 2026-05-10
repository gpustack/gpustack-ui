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

export const StorageTypeValueMap = {
  Local: 'local',
  Shared: 'shared',
  Object: 'object'
};

export const StorageTypeLabelMap: Record<string, string> = {
  [StorageTypeValueMap.Local]: 'gpuservice.storage.type.local',
  [StorageTypeValueMap.Shared]: 'gpuservice.storage.type.shared',
  [StorageTypeValueMap.Object]: 'gpuservice.storage.type.object'
};

export const StorageTypeOptions = [
  {
    label: StorageTypeLabelMap[StorageTypeValueMap.Local],
    value: StorageTypeValueMap.Local,
    locale: true
  },
  {
    label: StorageTypeLabelMap[StorageTypeValueMap.Shared],
    value: StorageTypeValueMap.Shared,
    locale: true
  },
  {
    label: StorageTypeLabelMap[StorageTypeValueMap.Object],
    value: StorageTypeValueMap.Object,
    locale: true
  }
];

export const AccessModeValueMap = {
  ReadWriteOnce: 'ReadWriteOnce',
  ReadOnlyMany: 'ReadOnlyMany',
  ReadWriteMany: 'ReadWriteMany',
  ReadWriteOncePod: 'ReadWriteOncePod'
};

export const AccessModeOptions = [
  {
    label: 'ReadWriteOnce',
    value: AccessModeValueMap.ReadWriteOnce
  },
  {
    label: 'ReadWriteMany',
    value: AccessModeValueMap.ReadWriteMany
  },
  {
    label: 'ReadOnlyMany',
    value: AccessModeValueMap.ReadOnlyMany
  },
  {
    label: 'ReadWriteOncePod',
    value: AccessModeValueMap.ReadWriteOncePod
  }
];

export const ReClaimPolicyValueMap = {
  Retain: 'Retain',
  Delete: 'Delete',
  Recycle: 'Recycle'
};

export const ReClaimPolicyOptions = [
  {
    label: 'Retain',
    value: ReClaimPolicyValueMap.Retain
  },
  {
    label: 'Delete',
    value: ReClaimPolicyValueMap.Delete
  },
  {
    label: 'Recycle',
    value: ReClaimPolicyValueMap.Recycle
  }
];

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
