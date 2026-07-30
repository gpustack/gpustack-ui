import { createContext, useContext } from 'react';
import { BenchmarkDetail } from './detail-types';

interface DetailContextProps {
  detailData: BenchmarkDetail;
  clusterList?: Global.BaseOption<number>[];
  id: number;
  loading?: boolean;
  profilesOptions: Global.BaseOption<string>[];
  // Bumped on every live (watch-driven) refresh so child views can re-pull
  // sub-resources (e.g. per-point results) that don't ride the row's stream.
  refreshToken?: number;
}

const DetailContext = createContext<DetailContextProps>(
  {} as DetailContextProps
);

export const useDetailContext = () => {
  const context = useContext(DetailContext);
  if (!context) {
    throw new Error('useDetailContext must be used within a DetailProvider');
  }
  return context;
};

export default DetailContext;
