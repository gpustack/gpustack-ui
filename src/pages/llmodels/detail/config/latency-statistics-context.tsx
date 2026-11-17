import { createContext, useContext, useState, type ReactNode } from 'react';
import {
  normalizeLatencyStatistics,
  type LatencyStatistic
} from '../utils/latency-statistics';

interface LatencyStatisticsValue {
  statistics: LatencyStatistic[];
  revision: number;
  onChange: (statistics: LatencyStatistic[]) => void;
}
const LatencyStatisticsContext = createContext<LatencyStatisticsValue | null>(
  null
);
export const useLatencyStatistics = () => useContext(LatencyStatisticsContext);

export function LatencyStatisticsProvider({
  children,
  value,
  onChange
}: {
  children: ReactNode;
  value?: LatencyStatistic[];
  onChange?: (statistics: LatencyStatistic[]) => void;
}) {
  const [local, setLocal] = useState({
    statistics: ['p99'] as LatencyStatistic[],
    revision: 0
  });
  return (
    <LatencyStatisticsContext.Provider
      value={{
        statistics: normalizeLatencyStatistics(value ?? local.statistics),
        revision: local.revision,
        onChange: (statistics) => {
          const next = normalizeLatencyStatistics(statistics);
          setLocal((current) => ({
            statistics: next,
            revision: current.revision + 1
          }));
          onChange?.(next);
        }
      }}
    >
      {children}
    </LatencyStatisticsContext.Provider>
  );
}
