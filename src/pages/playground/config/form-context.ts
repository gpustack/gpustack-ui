import { createContext, useContext } from 'react';

export interface FormContextProps {
  meta?: Record<string, any>;
  onValuesChange?: (changeValues: any, value: Record<string, any>) => void;
}

/**
 * for dynamic form config useContext
 */
export const FormContext = createContext<FormContextProps>({});

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormContextProvider');
  }
  return context;
};
