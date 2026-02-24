import { PageActionType } from '@/config/types';
import { createContext, useContext } from 'react';
import { maasProviderType } from '.';

interface FormContextProps {
  providerType?: maasProviderType;
  action: PageActionType;
  currentData?: any;
  id?: number;
  getCustomConfig?: () => Record<string, any>;
}

const FormContext = createContext<FormContextProps>({} as FormContextProps);

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
};

export default FormContext;
