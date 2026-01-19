import React from 'react';

interface LabelSelectorContextProps {
  options?: Array<{
    label: string;
    value: string | number;
    children?: { label: string; value: string | number }[];
  }>;
  placeholder?: string[];
  currentData?: Record<string, any>;
}

export const LabelSelectorContext =
  React.createContext<LabelSelectorContextProps>(
    {} as LabelSelectorContextProps
  );

export const useLabelSelectorContext = () => {
  const context = React.useContext(LabelSelectorContext);
  if (!context) {
    throw new Error(
      'useLabelSelectorContext must be used within a LabelSelectorProvider'
    );
  }
  return context;
};
