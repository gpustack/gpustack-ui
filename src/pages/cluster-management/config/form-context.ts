import { PageActionType } from '@/config/types';
import { createContext, useContext } from 'react';
import { ClusterListItem } from './types';

// for cluster form
interface FormContextProps {
  currentData?: ClusterListItem;
  // Whether the form is creating or editing. Distinct from `currentData`: the
  // registration wizard hands each step back its own previously-entered values
  // as `currentData` when the user steps away and returns, so that field says
  // "has values" rather than "is an existing cluster".
  action?: PageActionType;
  submitAttempted?: boolean;
  // K8s cluster type. `gpuInstanceOptions` on the form is derived from this —
  // the selector, the static-address field, and submit all read this single
  // source of truth instead of independently watching the (unregistered) form
  // path, which did not re-render reliably.
  clusterType?: 'model' | 'gpu';
  setClusterType?: (type: 'model' | 'gpu') => void;
}

export const FormContext = createContext<FormContextProps>({});

export const useFormContext = () => useContext(FormContext);
