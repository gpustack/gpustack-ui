import { createContext } from 'react';
import { DashboardProps } from './types';

export const DashboardContext = createContext<
  DashboardProps & { fetchData: () => Promise<void> }
>({} as DashboardProps & { fetchData: () => Promise<void> });

export default DashboardContext;
