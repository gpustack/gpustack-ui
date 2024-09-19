import React from 'react';

interface CompareContextProps {
  spans: {
    span: number;
    count: number;
  };
  systemMessage?: string;
  globalParams: Record<string, any>;
  loadingStatus: Record<symbol, boolean>;
  handleDeleteModel: (instanceId: symbol) => void;
  setSystemMessage?: (message: string) => void;
  setGlobalParams: (value: Record<string, any>) => void;
  setLoadingStatus: (instanceId: symbol, status: boolean) => void;
}
const CompareContext = React.createContext<CompareContextProps>(
  {} as CompareContextProps
);

export default CompareContext;
