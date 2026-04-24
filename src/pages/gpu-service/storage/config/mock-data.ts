import { StorageStatusValueMap, StorageTypeValueMap } from '.';
import { ListItem } from './types';

export const mockStorageData: ListItem[] = [
  {
    id: 1,
    name: 'local-nvme-cache',
    type: StorageTypeValueMap.Local,
    capacity_gb: 500,
    mount_path: '/mnt/nvme',
    access_modes: ['ReadWriteOnce'],
    parameters: {
      path: '/mnt/nvme'
    },
    status: StorageStatusValueMap.Available,
    cluster_id: 1,
    description: 'Local NVMe cache for hot model files',
    created_at: '2026-04-01T10:00:00Z',
    updated_at: '2026-04-10T10:00:00Z'
  },
  {
    id: 2,
    name: 'shared-model-store',
    type: StorageTypeValueMap.Shared,
    capacity_gb: 2048,
    mount_path: '/models',
    access_modes: ['ReadWriteMany'],
    parameters: {
      storageClassName: 'nfs-client'
    },
    status: StorageStatusValueMap.Bound,
    cluster_id: 1,
    description: 'Shared storage for model weights',
    created_at: '2026-04-02T10:00:00Z',
    updated_at: '2026-04-11T10:00:00Z'
  },
  {
    id: 3,
    name: 'object-dataset-bucket',
    type: StorageTypeValueMap.Object,
    capacity_gb: 10240,
    mount_path: '/datasets',
    access_modes: ['ReadOnlyMany'],
    parameters: {
      bucket: 'datasets'
    },
    status: StorageStatusValueMap.Released,
    cluster_id: 2,
    description: 'Object storage mounted for datasets',
    created_at: '2026-04-03T10:00:00Z',
    updated_at: '2026-04-12T10:00:00Z'
  },
  {
    id: 4,
    name: 'failed-shared-cache',
    type: StorageTypeValueMap.Shared,
    capacity_gb: 1024,
    mount_path: '/failed-cache',
    access_modes: ['ReadWriteMany'],
    parameters: {
      storageClassName: 'nfs-client'
    },
    status: StorageStatusValueMap.Failed,
    cluster_id: 2,
    description: 'Shared cache waiting for storage backend recovery',
    created_at: '2026-04-04T10:00:00Z',
    updated_at: '2026-04-13T10:00:00Z'
  }
];
