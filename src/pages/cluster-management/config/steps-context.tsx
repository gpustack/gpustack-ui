import { createContext, useContext } from 'react';

export interface StepsContextProps {
  presetClusterType?: 'model' | 'gpu';
  formValues: Record<string, any>;
  systemConfig?: Record<string, any>;
}

export const StepsContext = createContext<StepsContextProps>({
  formValues: {},
  systemConfig: {},
  presetClusterType: undefined
});

export const useStepsContext = () => useContext(StepsContext);
