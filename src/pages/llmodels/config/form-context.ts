import { PageActionType } from '@/config/types';
import React from 'react';
import { DeployFormKey } from './types';

interface FormContextProps {
  isGGUF?: boolean;
  formKey: DeployFormKey;
  source?: string;
  pageAction: PageActionType;
  gpuOptions?: any[];
  onValuesChange?: (changedValues: any, allValues: any) => void;
  onBackendChange?: (backend: string) => void;
}

interface CatalogFormContextProps {
  sizeOptions: Global.BaseOption<number>[];
  quantizationOptions: Global.BaseOption<string>[];
  onSizeChange: (val: number) => void;
  onQuantizationChange: (val: string) => void;
}

export const FormContext = React.createContext<FormContextProps>(
  {} as FormContextProps
);

export const CatalogFormContext = React.createContext<CatalogFormContextProps>(
  {} as CatalogFormContextProps
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
