import { StatusMaps } from '@/config';
import { StatusType } from '@/config/types';

export const BenchmarkStatusValueMap = {
  Pending: 'pending',
  Claimed: 'claimed',
  Running: 'running',
  Completed: 'completed',
  Error: 'error',
  Stopped: 'stopped',
  Unreachable: 'unreachable'
};

export const BenchmarkStatusLabelMap = {
  [BenchmarkStatusValueMap.Pending]: 'Pending',
  [BenchmarkStatusValueMap.Claimed]: 'Claimed',
  [BenchmarkStatusValueMap.Running]: 'Running',
  [BenchmarkStatusValueMap.Completed]: 'Completed',
  [BenchmarkStatusValueMap.Error]: 'Error',
  [BenchmarkStatusValueMap.Stopped]: 'Stopped',
  [BenchmarkStatusValueMap.Unreachable]: 'Unreachable'
};

export const BenchmarkStatus: Record<string, StatusType> = {
  [BenchmarkStatusValueMap.Pending]: StatusMaps.transitioning,
  [BenchmarkStatusValueMap.Claimed]: StatusMaps.warning,
  [BenchmarkStatusValueMap.Running]: StatusMaps.success,
  [BenchmarkStatusValueMap.Completed]: StatusMaps.success,
  [BenchmarkStatusValueMap.Error]: StatusMaps.error,
  [BenchmarkStatusValueMap.Unreachable]: StatusMaps.error,
  [BenchmarkStatusValueMap.Stopped]: StatusMaps.warning
};

export const ProfileValueMap = {
  LatencyShort: 'latency_short',
  ThroughputMedium: 'throughput_medium',
  LongContextStress: 'long_context_stress',
  GenerationHeavy: 'generation_heavy',
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
    value: ProfileValueMap.LatencyShort,
    locale: true
  },
  {
    label: 'benchmark.form.profile.throughput',
    value: ProfileValueMap.ThroughputMedium,
    locale: true
  },
  {
    label: 'benchmark.form.profile.longContext',
    value: ProfileValueMap.LongContextStress,
    locale: true
  },
  {
    label: 'benchmark.form.profile.heavy',
    value: ProfileValueMap.GenerationHeavy,
    locale: true
  },
  {
    label: 'benchmark.form.profile.custom',
    value: ProfileValueMap.Custom,
    locale: true
  }
];
