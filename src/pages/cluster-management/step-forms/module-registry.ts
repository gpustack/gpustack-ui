import React from 'react';
import AddWorkerStep from '../components/add-worker-step';
import ProviderCatalog from '../components/provider-catalog';
import BasicForm from './basic-form';
import WorkerPoolForm from './worker-pools-form';

export const moduleMap = {
  BasicForm: 'BasicForm',
  WorkerPoolForm: 'WorkerPoolForm',
  ProviderCatalog: 'ProviderCatalog',
  AddWorkerStep: 'AddWorkerStep'
};

export const moduleRegistry: Record<string, React.ComponentType<any>> = {
  [moduleMap.BasicForm]: BasicForm,
  [moduleMap.WorkerPoolForm]: WorkerPoolForm,
  [moduleMap.ProviderCatalog]: ProviderCatalog,
  [moduleMap.AddWorkerStep]: AddWorkerStep
};
