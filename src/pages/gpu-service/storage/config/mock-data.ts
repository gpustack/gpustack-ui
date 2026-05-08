import { StorageTypeValueMap } from '.';
import { ListItem } from './types';

export const mockStorageData: (ListItem & { cluster_id: number })[] = [
  {
    id: 1,
    cluster_id: 1,
    metadata: {
      name: 'local-nvme-cache',
      namespace: 'default'
    },
    spec: {
      accessMode: 'ReadWriteOnce',
      capacity: '500Gi',
      type: StorageTypeValueMap.Local
    },
    created_at: '2026-04-01T10:00:00Z',
    updated_at: '2026-04-10T10:00:00Z'
  },
  {
    id: 2,
    cluster_id: 1,
    metadata: {
      name: 'shared-model-store',
      namespace: 'default'
    },
    spec: {
      accessMode: 'ReadWriteMany',
      capacity: '2Ti',
      type: StorageTypeValueMap.Shared
    },
    created_at: '2026-04-02T10:00:00Z',
    updated_at: '2026-04-11T10:00:00Z'
  },
  {
    id: 3,
    cluster_id: 2,
    metadata: {
      name: 'object-dataset-bucket',
      namespace: 'default'
    },
    spec: {
      accessMode: 'ReadOnlyMany',
      capacity: '10Ti',
      type: StorageTypeValueMap.Object
    },
    created_at: '2026-04-03T10:00:00Z',
    updated_at: '2026-04-12T10:00:00Z'
  },
  {
    id: 4,
    cluster_id: 2,
    metadata: {
      name: 'failed-shared-cache',
      namespace: 'default'
    },
    spec: {
      accessMode: 'ReadWriteMany',
      capacity: '1Ti',
      type: StorageTypeValueMap.Shared
    },
    created_at: '2026-04-04T10:00:00Z',
    updated_at: '2026-04-13T10:00:00Z'
  }
];
