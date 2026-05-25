import { PageActionType } from '@/config/types';
import { createContext } from 'react';

export interface FormContextValue {
  action: PageActionType;
  currentData: any;
}

export const FormContext = createContext<FormContextValue>({
  action: 'create',
  currentData: null
});

export const FormContextProvider = FormContext.Provider;
