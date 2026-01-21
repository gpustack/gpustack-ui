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
