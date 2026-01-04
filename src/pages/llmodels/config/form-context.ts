import { PageActionType } from '@/config/types';
import React from 'react';
import { BackendOption, DeployFormKey, FormData } from './types';

type EmptyObject = Record<never, never>;

type CascaderOption<T extends object = EmptyObject> = {
  label: string;
  value: string | number;
  parent?: boolean;
  disabled?: boolean;
  index?: number;
  children?: CascaderOption<T>[];
} & Partial<T>;

interface FormContextProps {
  isGGUF?: boolean;
  formKey: DeployFormKey;
  source: string;
  action: PageActionType;
  gpuOptions: CascaderOption[];
  workerLabelOptions: CascaderOption[];
  backendOptions: BackendOption[];
  initialValues?: FormData; // for editing model
  modelContextData?: Record<string, any>;
  clearCacheFormValues?: () => void;
  onValuesChange?: (changedValues: any, allValues: any) => void;
  onBackendChange: (backend: string, option: any) => void;
}

interface CatalogFormContextProps {
  sizeOptions: Global.BaseOption<number>[];
  quantizationOptions: Global.BaseOption<string>[];
  modeList: Global.BaseOption<string, { isBuiltIn: boolean; tips: string }>[];
  onModeChange: (val: string) => void;
  onSizeChange?: (val: number) => void;
  onQuantizationChange?: (val: string) => void;
}

interface FormOuterContextProps {
  sourceList?: Global.BaseOption<string>[];
}

export const FormContext = React.createContext<FormContextProps>(
  {} as FormContextProps
);

/**
 * Catalog form context
 */
export const CatalogFormContext = React.createContext<CatalogFormContextProps>(
  {} as CatalogFormContextProps
);

export const FormOuterContext = React.createContext<FormOuterContextProps>(
  {} as FormOuterContextProps
);

/**
 * Hooks to use the form context
 */

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

/**
 *
 * Hooks to use the outer form context
 */

export const useFormOuterContext = () => {
  const context = React.useContext(FormOuterContext);
  if (!context) {
    throw new Error(
      'useFormOuterContext must be used within a FormOuterProvider'
    );
  }
  return context;
};
