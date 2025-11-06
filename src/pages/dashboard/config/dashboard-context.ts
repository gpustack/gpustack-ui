import { createContext } from 'react';
import { DashboardProps } from './types';

export const DashboardContext = createContext<
  DashboardProps & {
    fetchData: (params?: { [key: string]: any }) => Promise<void>;
  }
>(
  {} as DashboardProps & {
    fetchData: (params?: { [key: string]: any }) => Promise<void>;
  }
);

export default DashboardContext;
