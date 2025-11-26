import { createContext, useContext } from 'react';

interface ScrollerContextProps {
  total: number; // total pages
  current: number;
  loading: boolean;
  refresh: (nextPage: number) => void;
  onBottom?: () => void;
  throttleDelay?: number;
}

export const ScrollerContext = createContext<ScrollerContextProps>(
  {} as ScrollerContextProps
);

export const useScrollerContext = () => {
  const context = useContext(ScrollerContext);
  if (!context) {
    throw new Error(
      'useScrollerContext must be used within a ScrollerProvider'
    );
  }
  return context;
};
