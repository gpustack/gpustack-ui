import { createContext, useContext } from 'react';
import { ClusterListItem } from './types';

// for cluster form
interface FormContextProps {
  currentData?: ClusterListItem;
  submitAttempted?: boolean;
}

export const FormContext = createContext<FormContextProps>({});

export const useFormContext = () => useContext(FormContext);
