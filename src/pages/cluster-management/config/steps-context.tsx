import { createContext, useContext } from 'react';

export interface StepsContextProps {
  formValues: Record<string, any>;
}

export const StepsContext = createContext<StepsContextProps>({
  formValues: {}
});

export const useStepsContext = () => useContext(StepsContext);
