import React from 'react';

export interface SealFormItemProps {
  label?: React.ReactNode;
  required?: boolean;
  isInFormItems?: boolean;
  description?: React.ReactNode;
  extra?: React.ReactNode;
  addAfter?: React.ReactNode;
  allowNull?: boolean;
  loading?: React.ReactNode;
  trim?: boolean;
  checkStatus?: 'success' | 'error' | 'warning' | '';
}
