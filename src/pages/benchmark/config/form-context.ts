import { PageActionType } from '@/config/types';
import { createContext, useContext } from 'react';
import { BenchmarkListItem } from './types';

interface FormContextProps {
  action: PageActionType;
  open?: boolean;
  clusterList?: Global.BaseOption<number>[];
  modelList?: Global.BaseOption<number>[];
  profilesOptions: Global.BaseOption<string>[];
  datasetList: Global.BaseOption<number | string>[];
  // Source row for EDIT / CLONE prefill; used to initialize disclosure toggles
  // (data distribution / shared prefix) from the config being cloned.
  currentData?: BenchmarkListItem;
  // Regenerate the auto default name from the current model + profile, unless the
  // user has manually edited it. Called from the model-instance / profile
  // onChange handlers.
  applyAutoName?: () => void;
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
