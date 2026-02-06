import { StatusMaps } from '@/config';
import { StatusType } from '@/config/types';

export const BenchmarkStatusValueMap = {
  Pending: 'pending',
  QUEUED: 'queued',
  Running: 'running',
  Completed: 'completed',
  Error: 'error',
  Stopped: 'stopped',
  Unreachable: 'unreachable'
};

export const BenchmarkStatusLabelMap = {
  [BenchmarkStatusValueMap.Pending]: 'Pending',
  [BenchmarkStatusValueMap.QUEUED]: 'Queued',
  [BenchmarkStatusValueMap.Running]: 'Running',
  [BenchmarkStatusValueMap.Completed]: 'Completed',
  [BenchmarkStatusValueMap.Error]: 'Error',
  [BenchmarkStatusValueMap.Stopped]: 'Stopped',
  [BenchmarkStatusValueMap.Unreachable]: 'Unreachable'
};

export const BenchmarkStatus: Record<string, StatusType> = {
  [BenchmarkStatusValueMap.Pending]: StatusMaps.transitioning,
  [BenchmarkStatusValueMap.QUEUED]: StatusMaps.warning,
  [BenchmarkStatusValueMap.Running]: StatusMaps.success,
  [BenchmarkStatusValueMap.Completed]: StatusMaps.success,
  [BenchmarkStatusValueMap.Error]: StatusMaps.error,
  [BenchmarkStatusValueMap.Unreachable]: StatusMaps.error,
  [BenchmarkStatusValueMap.Stopped]: StatusMaps.warning
};

export const ProfileValueMap = {
  LatencyShort: 'Latency',
  ThroughputMedium: 'Throughput',
  LongContextStress: 'Long Context',
  GenerationHeavy: 'Generation Heavy',
  Custom: 'Custom'
};

export const ProfileLabelMap = {
  [ProfileValueMap.LatencyShort]: 'benchmark.form.profile.latency',
  [ProfileValueMap.ThroughputMedium]: 'benchmark.form.profile.throughput',
  [ProfileValueMap.LongContextStress]: 'benchmark.form.profile.longContext',
  [ProfileValueMap.GenerationHeavy]: 'benchmark.form.profile.heavy',
  [ProfileValueMap.Custom]: 'benchmark.form.profile.custom'
};

export const profileOptions = [
  {
    label: 'benchmark.form.profile.latency',
    tips: 'benchmark.form.profile.latency.tips',
    value: ProfileValueMap.LatencyShort,
    locale: true
  },
  {
    label: 'benchmark.form.profile.throughput',
    tips: 'benchmark.form.profile.throughput.tips',
    value: ProfileValueMap.ThroughputMedium,
    locale: true
  },
  {
    label: 'benchmark.form.profile.longContext',
    tips: 'benchmark.form.profile.longContext.tips',
    value: ProfileValueMap.LongContextStress,
    locale: true
  },
  {
    label: 'benchmark.form.profile.heavy',
    tips: 'benchmark.form.profile.heavy.tips',
    value: ProfileValueMap.GenerationHeavy,
    locale: true
  }
];

export const DatasetValueMap = {
  ShareGPT: 'ShareGPT',
  Random: 'Random'
};

export const datasetList = [
  {
    name: 'ShareGPT',
    label: 'ShareGPT',
    value: DatasetValueMap.ShareGPT
  },
  {
    name: 'Random',
    label: 'Random',
    value: DatasetValueMap.Random
  }
];
