import { createContext, useContext } from 'react';

export interface StepsContextProps {
  formValues: Record<string, any>;
  systemConfig?: Record<string, any>;
}

export const StepsContext = createContext<StepsContextProps>({
  formValues: {},
  systemConfig: {}
});

export const useStepsContext = () => useContext(StepsContext);
