import { createContext } from 'react';

export interface FormContextValue {
  storageClassList: Global.BaseOption<string>[];
}

export const FormContext = createContext<FormContextValue>({
  storageClassList: []
});

export default FormContext;
