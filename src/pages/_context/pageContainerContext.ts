import { PageContainerProps } from '@ant-design/pro-components';
import { createContext, useContext } from 'react';

interface PageContainerContextProps extends Partial<PageContainerProps> {
  [key: string]: any;
}

export const PageContainerContext = createContext<PageContainerContextProps>(
  {}
);

export function usePageContainerContext() {
  const context = useContext(PageContainerContext);
  if (!context) {
    throw new Error(
      'usePageContainerContext must be used within a PageContainerProvider'
    );
  }
  return context;
}
