export const StepNamesMap = {
  SelectCluster: 'SelectCluster',
  SelectGPU: 'SelectGPU',
  CheckEnv: 'CheckEnv',
  SpecifyArgs: 'SpecifyArgs',
  RunCommand: 'RunCommand'
} as const;

export type StepName = keyof typeof StepNamesMap;

export const DockerStepsFromCluster = [
  StepNamesMap.SelectGPU,
  StepNamesMap.CheckEnv,
  StepNamesMap.SpecifyArgs,
  StepNamesMap.RunCommand
];

export const DockerStepsFromWorker = [
  StepNamesMap.SelectCluster,
  StepNamesMap.SelectGPU,
  StepNamesMap.CheckEnv,
  StepNamesMap.SpecifyArgs,
  StepNamesMap.RunCommand
];

export const K8sStepsFromCluter = [
  StepNamesMap.SelectGPU,
  StepNamesMap.CheckEnv,
  StepNamesMap.RunCommand
];

export interface SummaryDataKeys {
  currentGPU: string;
  cluster_id: number;
  clusterName: string;
  workerCommand: {
    label: string;
    link: string;
    notes: string[];
  };
  modelDirConfig: {
    enabled: boolean;
    path: string;
  };
  cacheDirConfig: {
    enabled: boolean;
    path: string;
  };
  workerIPConfig: {
    enabled: boolean;
    ip: string;
    required: boolean;
  };
  containerNameConfig: {
    enabled: boolean;
    name: string;
  };
  gpustackDataVolumeConfig: {
    enabled: boolean;
    path: string;
  };
  externalWorkerIPConfig: {
    enable: boolean;
    ip: string;
    required: boolean;
  };
}

export type SummaryDataMap = {
  [key in keyof SummaryDataKeys]: SummaryDataKeys[key];
};

export type SummaryDataKey = keyof SummaryDataKeys;

export interface AddWorkerStepProps {
  disabled?: boolean;
}
