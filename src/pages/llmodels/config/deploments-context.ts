import { ListItem as WorkerListItem } from '@/pages/resources/config/types';
import { createContext, useContext } from 'react';
import { ListItem as ModelListItem } from '../config/types';

interface DeploymentsContextProps {
  clusterList: Global.BaseOption<
    number,
    {
      provider: string;
      state: string;
      is_default: boolean;
    }
  >[];
  workerList: WorkerListItem[];
  generateFormValues: (
    data: ModelListItem,
    gpuOptions: any
  ) => Record<string, any>;
}

export const DeploymentsContext = createContext<DeploymentsContextProps>({
  clusterList: [],
  workerList: [],
  generateFormValues: () => ({})
});

export const useDeploymentsContext = () => {
  const context = useContext(DeploymentsContext);
  if (!context) {
    throw new Error(
      'useDeploymentsContext must be used within a DeploymentsProvider'
    );
  }
  return context;
};
