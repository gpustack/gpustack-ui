import { PageActionType } from '@/config/types';
import React from 'react';
import { BackendOption, DeployFormKey } from './types';

interface FormContextProps {
  isGGUF?: boolean;
  formKey: DeployFormKey;
  source: string;
  pageAction: PageActionType;
  gpuOptions?: any[];
  backendOptions: BackendOption[];
  onValuesChange?: (changedValues: any, allValues: any) => void;
  onBackendChange: (backend: string, option: any) => void;
}

interface CatalogFormContextProps {
  sizeOptions: Global.BaseOption<number>[];
  quantizationOptions: Global.BaseOption<string>[];
  onSizeChange: (val: number) => void;
  onQuantizationChange: (val: string) => void;
}

interface FormOuterContextProps {
  sourceList?: Global.BaseOption<string>[];
}

export const FormContext = React.createContext<FormContextProps>(
  {} as FormContextProps
);

export const CatalogFormContext = React.createContext<CatalogFormContextProps>(
  {} as CatalogFormContextProps
);

export const FormOuterContext = React.createContext<FormOuterContextProps>(
  {} as FormOuterContextProps
);

export const useFormContext = () => {
  const context = React.useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
};

export const useCatalogFormContext = () => {
  const context = React.useContext(CatalogFormContext);
  if (!context) {
    throw new Error(
      'useCatalogFormContext must be used within a CatalogFormProvider'
    );
  }
  return context;
};

export const useFormOuterContext = () => {
  const context = React.useContext(FormOuterContext);
  if (!context) {
    throw new Error(
      'useFormOuterContext must be used within a FormOuterProvider'
    );
  }
  return context;
};
