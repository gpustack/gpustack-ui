import { StatusMaps } from '@/config';
import { ProviderValueMap } from '@/pages/cluster-management/config';
import {
  dockerEnvCommandMap,
  generateKubernetesEnvCommand,
  registerAddWokerCommandMap
} from './gpu-driver';

export const WorkerStatusMap = {
  ready: 'ready',
  not_ready: 'not_ready',
  unreachable: 'unreachable',
  provisioning: 'provisioning',
  deleting: 'deleting',
  error: 'error',
  pending: 'pending',
  initializing: 'initializing',
  maintenance: 'maintenance'
};

export const WorkerStatusMapValue = {
  [WorkerStatusMap.ready]: 'Ready',
  [WorkerStatusMap.not_ready]: 'Not Ready',
  [WorkerStatusMap.unreachable]: 'Unreachable',
  [WorkerStatusMap.provisioning]: 'Provisioning',
  [WorkerStatusMap.deleting]: 'Deleting',
  [WorkerStatusMap.error]: 'Error',
  [WorkerStatusMap.initializing]: 'Initializing',
  [WorkerStatusMap.pending]: 'Pending',
  [WorkerStatusMap.maintenance]: 'Maintenance'
};

export const status: any = {
  [WorkerStatusMap.ready]: StatusMaps.success,
  [WorkerStatusMap.not_ready]: StatusMaps.error,
  [WorkerStatusMap.unreachable]: StatusMaps.error,
  [WorkerStatusMap.provisioning]: StatusMaps.transitioning,
  [WorkerStatusMap.deleting]: StatusMaps.transitioning,
  [WorkerStatusMap.error]: StatusMaps.error,
  [WorkerStatusMap.pending]: StatusMaps.transitioning,
  [WorkerStatusMap.initializing]: StatusMaps.transitioning,
  [WorkerStatusMap.maintenance]: StatusMaps.warning
};
export const checkEnvCommand = (gpu: string) => {
  return {
    [ProviderValueMap.Docker]: dockerEnvCommandMap[gpu] || '',
    [ProviderValueMap.Kubernetes]: generateKubernetesEnvCommand(gpu) || ''
  };
};

export const generateAddWokerCommand = (params: {
  server: string;
  tag: string;
  token: string;
  image: string;
  gpu: string;
}) => {};

export const addWorkerGuide: Record<string, any> = {
  all: {
    registerWorker(params: {
      server: string;
      tag: string;
      token: string;
      image: string;
      gpu: string;
      [key: string]: any;
    }) {
      return registerAddWokerCommandMap[params.gpu]?.(params);
    },
    checkEnvCommand: checkEnvCommand
  }
};

export const ModelfileStateMap = {
  Error: 'error',
  Downloading: 'downloading',
  Ready: 'ready'
};

export const ModelfileStateMapValue = {
  [ModelfileStateMap.Error]: 'Error',
  [ModelfileStateMap.Downloading]: 'Downloading',
  [ModelfileStateMap.Ready]: 'Ready'
};

export const ModelfileState: any = {
  [ModelfileStateMap.Ready]: StatusMaps.success,
  [ModelfileStateMap.Error]: StatusMaps.error,
  [ModelfileStateMap.Downloading]: StatusMaps.transitioning
};
