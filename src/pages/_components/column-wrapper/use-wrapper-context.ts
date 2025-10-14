import { createContext, useContext } from 'react';

interface WrapperContextProps {
  osInstance?: any;
  scrollToBottom?: () => void;
  scrollToTop?: () => void;
  scrollToTarget?: (target: any, offset?: number) => void;
}

export const WrapperContext = createContext<WrapperContextProps>(
  {} as WrapperContextProps
);

export const useWrapperContext = () => {
  const context = useContext(WrapperContext);
  if (!context) {
    throw new Error('useWrapperContext must be used within a WrapperProvider');
  }
  return context;
};
