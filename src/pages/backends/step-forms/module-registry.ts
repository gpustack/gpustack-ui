import React from 'react';
import BasicForm from './basic-form';
import ParamertersForm from './parameters-form';
import VersionConfigForm from './version-config-form';

export const moduleMap = {
  BasicForm: 'BasicForm',
  VersionConfigForm: 'VersionConfigForm',
  ParamertersForm: 'ParamertersForm'
};

export const moduleRegistry: Record<string, React.ComponentType<any>> = {
  [moduleMap.BasicForm]: BasicForm,
  [moduleMap.VersionConfigForm]: VersionConfigForm,
  [moduleMap.ParamertersForm]: ParamertersForm
};
