import { PageActionType } from '@/config/types';
import { createContext, useContext } from 'react';

interface FormContextProps {
  action: PageActionType;
  backendSource: string;
  showCustomSuffix: boolean;
}

export const FormContext = createContext<FormContextProps | null>(
  {} as FormContextProps
);

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormContextProvider');
  }
  return context;
};
