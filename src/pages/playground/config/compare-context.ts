import React from 'react';

interface CompareContextProps {
  spans: {
    span: number;
    count: number;
  };
  systemMessage?: string;
  globalParams: Record<string, any>;
  loadingStatus: Record<string, boolean>;
  handleDeleteModel: (modelname: string) => void;
  setSystemMessage?: (message: string) => void;
  setGlobalParams: (value: Record<string, any>) => void;
  setLoadingStatus: (modeName: string, status: boolean) => void;
}
const CompareContext = React.createContext<CompareContextProps>(
  {} as CompareContextProps
);

export default CompareContext;
