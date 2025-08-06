import { StatusMaps } from '@/config';
import { StatusType } from '@/config/types';

export const ClusterDataList = [
  {
    id: 3,
    name: 'Custom-cluster',
    provider: 'custom',
    clusterType: 'Custom',
    workers: 4,
    gpus: 8,
    status: 'ready',
    deployments: 3
  },
  {
    id: 1,
    name: 'kubernetes-cluster',
    provider: 'kubernetes',
    clusterType: 'Kubernetes',
    workers: 2,
    gpus: 4,
    status: 'ready',
    deployments: 1
  },
  {
    id: 2,
    name: 'Digital-Ocean-cluster',
    provider: 'digitalocean',
    workers: 3,
    gpus: 6,
    status: 'error',
    deployments: 2
  }
];

export const ClusterStatusValueMap = {
  Ready: 'ready',
  Error: 'error'
};

export const ClusterStatusLabelMap = {
  [ClusterStatusValueMap.Ready]: 'Ready',
  [ClusterStatusValueMap.Error]: 'Error'
};

export const ClusterStatus: Record<string, StatusType> = {
  [ClusterStatusValueMap.Ready]: StatusMaps.success,
  [ClusterStatusValueMap.Error]: StatusMaps.error
};

export const ProviderValueMap = {
  Kubernetes: 'kubernetes',
  DigitalOcean: 'digitalocean',
  Custom: 'custom'
};

export const ProviderLabelMap = {
  [ProviderValueMap.Kubernetes]: 'Kubernetes',
  [ProviderValueMap.DigitalOcean]: 'Digital Ocean',
  [ProviderValueMap.Custom]: 'Custom'
};
