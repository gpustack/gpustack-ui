import { createContext, useContext } from 'react';
import type { MonitoringData } from '../hooks/use-monitoring-data';
import type { DetailTab, ResourceDevice } from './types';
export interface DetailContextValue extends MonitoringData {
  tab: DetailTab;
  setTab: (tab: DetailTab) => void;
  inspectDevice: (device: ResourceDevice) => void;
  openMonitoringSection: (section: string) => void;
}
export const DetailContext = createContext<DetailContextValue | null>(null);
export const useDetail = () => {
  const value = useContext(DetailContext);
  if (!value) throw new Error('Model detail context is required');
  return value;
};
