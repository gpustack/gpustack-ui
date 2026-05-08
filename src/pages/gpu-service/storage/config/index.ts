import { icons } from '@gpustack/core-ui';

export const StorageTypeValueMap = {
  Local: 'local',
  Shared: 'shared',
  Object: 'object'
};

export const StorageTypeLabelMap: Record<string, string> = {
  [StorageTypeValueMap.Local]: '本地存储',
  [StorageTypeValueMap.Shared]: '共享存储',
  [StorageTypeValueMap.Object]: '对象存储'
};

export const StorageTypeOptions = [
  {
    label: StorageTypeLabelMap[StorageTypeValueMap.Local],
    value: StorageTypeValueMap.Local
  },
  {
    label: StorageTypeLabelMap[StorageTypeValueMap.Shared],
    value: StorageTypeValueMap.Shared
  },
  {
    label: StorageTypeLabelMap[StorageTypeValueMap.Object],
    value: StorageTypeValueMap.Object
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
