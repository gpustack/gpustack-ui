import React from 'react';

export interface SealFormItemProps {
  label?: React.ReactNode;
  required?: boolean;
  isInFormItems?: boolean;
  description?: React.ReactNode;
  extra?: React.ReactNode;
}
