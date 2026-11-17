import { createContext, useContext } from 'react';
import type { ResourceDetailData } from '../hooks/use-resource-detail';
import type { ResourceTab } from './types';
export interface ResourceContextValue extends ResourceDetailData {
  tab: ResourceTab;
  setTab: (tab: ResourceTab) => void;
}
export const ResourceContext = createContext<ResourceContextValue | null>(null);
export const useResource = () => {
  const value = useContext(ResourceContext);
  if (!value) throw new Error('Resource detail context is required');
  return value;
};
