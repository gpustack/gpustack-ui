import { createContext, useContext } from 'react';
import { ProviderType } from '../../config';
import { ClusterListItem } from '../../config/types';
import { SummaryDataKey } from './config';

interface AddWorkerContextProps {
  clusterList?: Global.BaseOption<number, ClusterListItem>[];
  clusterLoading?: boolean;
  provider: ProviderType;
  stepList: string[];
  actionSource?: 'modal' | 'page';
  onCancel?: () => void;
  onClusterChange?: (value: number, row?: any) => void;
  collapseKey: Set<string>;
  onToggle: (open: boolean, key: string) => void;
  registrationInfo: {
    token: string;
    image: string;
    server_url: string;
    cluster_id: number | null;
  };
  registerField: (key: SummaryDataKey) => () => void;
  updateField: (key: SummaryDataKey, value: any) => void;
  summary: Map<string, any>;
}

export const AddWorkerContext = createContext<AddWorkerContextProps | null>({
  summary: new Map()
} as AddWorkerContextProps);

export const useAddWorkerContext = () => {
  const context = useContext(AddWorkerContext);
  if (!context) {
    throw new Error(
      'useAddWorkerContext must be used within an AddWorkerContext.Provider'
    );
  }
  return context;
};
