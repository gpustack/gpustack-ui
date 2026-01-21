import { StatusMaps } from '@/config';
import { StatusType } from '@/config/types';

export const BenchmarkStatusValueMap = {
  Pending: 'pending',
  Claimed: 'claimed',
  Running: 'running',
  Completed: 'completed',
  Error: 'error',
  Unreachable: 'unreachable'
};

export const BenchmarkStatusLabelMap = {
  [BenchmarkStatusValueMap.Pending]: 'Pending',
  [BenchmarkStatusValueMap.Claimed]: 'Claimed',
  [BenchmarkStatusValueMap.Running]: 'Running',
  [BenchmarkStatusValueMap.Completed]: 'Completed',
  [BenchmarkStatusValueMap.Error]: 'Error',
  [BenchmarkStatusValueMap.Unreachable]: 'Unreachable'
};

export const BenchmarkStatus: Record<string, StatusType> = {
  [BenchmarkStatusValueMap.Pending]: StatusMaps.transitioning,
  [BenchmarkStatusValueMap.Claimed]: StatusMaps.warning,
  [BenchmarkStatusValueMap.Running]: StatusMaps.success,
  [BenchmarkStatusValueMap.Completed]: StatusMaps.success,
  [BenchmarkStatusValueMap.Error]: StatusMaps.error,
  [BenchmarkStatusValueMap.Unreachable]: StatusMaps.error
};

export const profileOptions = [
  {
    label: 'benchmark.form.profile.latency',
    value: 'latency_short',
    locale: true
  },
  {
    label: 'benchmark.form.profile.throughput',
    value: 'throughput_medium',
    locale: true
  },
  {
    label: 'benchmark.form.profile.longContext',
    value: 'long_context_stress',
    locale: true
  },
  {
    label: 'benchmark.form.profile.heavy',
    value: 'generation_heavy',
    locale: true
  },
  { label: 'benchmark.form.profile.custom', value: 'custom', locale: true }
];
