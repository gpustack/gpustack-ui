import { PageActionType } from '@/config/types';
import React from 'react';

interface FormContextProps {
  isGGUF?: boolean;
  byBuiltIn?: boolean;
  pageAction: PageActionType;
  sizeOptions?: Global.BaseOption<number>[];
  quantizationOptions?: Global.BaseOption<string>[];
  modelFileOptions?: any[];
  onSizeChange?: (val: number) => void;
  onQuantizationChange?: (val: string) => void;
  onValuesChange?: (changedValues: any, allValues: any) => void;
}

interface FormInnerContextProps {
  onBackendChange?: (backend: string) => void;
  onValuesChange?: (changedValues: any, allValues: any) => void;
  gpuOptions?: any[];
}

export const FormContext = React.createContext<FormContextProps>(
  {} as FormContextProps
);

export const FormInnerContext = React.createContext<FormInnerContextProps>(
  {} as FormInnerContextProps
);

export const useFormContext = () => {
  const context = React.useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
};

export const useFormInnerContext = () => {
  const context = React.useContext(FormInnerContext);
  if (!context) {
    throw new Error(
      'useFormInnerContext must be used within a FormInnerProvider'
    );
  }
  return context;
};
