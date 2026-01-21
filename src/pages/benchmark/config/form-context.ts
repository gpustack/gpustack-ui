import { PageActionType } from '@/config/types';
import { createContext, useContext } from 'react';

interface FormContextProps {
  action: PageActionType;
}

const FormContext = createContext<FormContextProps>({} as FormContextProps);

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error(
      'useFormContext must be used within a FormContext.Provider'
    );
  }
  return context;
};

export default FormContext;
