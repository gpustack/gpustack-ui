import { StatusMaps } from '@/config';
import { StatusType } from '@/config/types';
import { icons } from '@gpustack/core-ui';
import { StorageTypeKind } from './types';

export const StorageTypePhaseValueMap = {
  Ready: 'Ready',
  Deleting: 'Deleting'
};

export const StorageTypePhaseLabelMap: Record<string, string> = {
  [StorageTypePhaseValueMap.Ready]: 'Ready',
  [StorageTypePhaseValueMap.Deleting]: 'Deleting'
};

export const status: Record<string, StatusType> = {
  [StorageTypePhaseValueMap.Ready]: StatusMaps.success,
  [StorageTypePhaseValueMap.Deleting]: StatusMaps.warning
};

export const StorageTypeKindValueMap: Record<string, StorageTypeKind> = {
  NFS: 'nfs',
  S3: 's3'
};

export const StorageTypeKindLabelMap: Record<string, string> = {
  [StorageTypeKindValueMap.NFS]: 'NFS',
  [StorageTypeKindValueMap.S3]: 'S3'
};

export const StorageTypeKindOptions = [
  { label: 'NFS', value: StorageTypeKindValueMap.NFS },
  { label: 'S3', value: StorageTypeKindValueMap.S3 }
];

export const DefaultNFSMountOptions = [
  'hard',
  'vers=4',
  'rsize=1048576',
  'wsize=1048576',
  'noatime',
  'nodiratime'
];

export const DefaultS3MountOptions = [
  '--no-checksum',
  '--memory-limit=4000',
  '--max-flushers=32',
  '--max-parallel-parts=32',
  '--part-sizes=25',
  '--list-type=2',
  '--no-specials'
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
