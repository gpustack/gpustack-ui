import { PageActionType } from '@/config/types';
import { createContext, useContext } from 'react';

interface FormContextProps {
  providerType?: string;
  action?: PageActionType;
}

const FormContext = createContext<FormContextProps>({});

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
};

export default FormContext;
