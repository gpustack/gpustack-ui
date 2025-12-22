import { createContext } from 'react';
import { DashboardProps } from './types';

export const DashboardContext = createContext<
  DashboardProps & {
    fetchData: (params?: { [key: string]: any }) => Promise<void>;
    clusterList?: Global.BaseOption<
      number,
      { provider: string; state: string | number }
    >[];
  }
>(
  {} as DashboardProps & {
    fetchData: (params?: { [key: string]: any }) => Promise<void>;
    clusterList: Global.BaseOption<
      number,
      { provider: string; state: string | number }
    >[];
  }
);

export default DashboardContext;
