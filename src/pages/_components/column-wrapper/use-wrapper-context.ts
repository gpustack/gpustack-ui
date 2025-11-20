import { createContext, useContext } from 'react';

interface WrapperContextProps {
  osInstance?: any;
  scroller?: any;
  scrollEventElement?: any;
  scrollToBottom?: () => void;
  scrollToTop?: () => void;
  getScrollElementScrollableHeight?: () => {
    scrollHeight: number;
    scrollTop: number;
  };
  scrollToTarget?: (target: any, offset?: number) => void;
  getScrollElement?: () => HTMLElement | null;
  setSScrollContentPaddingBottom?: (padding: number) => void;
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
