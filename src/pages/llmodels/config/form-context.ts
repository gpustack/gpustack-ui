import React from 'react';

interface FormContextProps {
  isGGUF?: boolean;
  byBuiltIn?: boolean;
  sizeOptions?: Global.BaseOption<number>[];
  quantizationOptions?: Global.BaseOption<string>[];
  modelFileOptions?: any[];
  onSizeChange?: (val: number) => void;
  onQuantizationChange?: (val: string) => void;
  onValuesChange?: (val: any) => void;
}

interface FormInnerContextProps {
  onBackendChange?: (backend: string) => void;
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
