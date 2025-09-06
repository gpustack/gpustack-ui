import { useNavigate } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { useMemo } from 'react';
import { ProviderType, ProviderValueMap } from '../config';
import { moduleMap } from './module-registry';

export default function useStepList() {
  const navigate = useNavigate();

  const handleBack = useMemoizedFn(() => {
    navigate(-1);
  });

  return useMemo(
    () => [
      {
        title: 'Select Cloud Provider',
        content: 'Choose the cloud provider for your cluster.',
        showButtons: (provider?: ProviderType) => {
          return {
            previous: false,
            next: true,
            save: false,
            skip: false
          };
        },
        defaultShow: true,
        showForms: [],
        showModules: [moduleMap.ProviderCatalog],
        providers: []
      },
      {
        title: 'Configure Cluster Settings',
        content: 'Set up the basic configuration for your cluster.',
        showButtons: (provider?: ProviderType) => {
          return {
            previous: true,
            next: provider === ProviderValueMap.DigitalOcean,
            save: provider !== ProviderValueMap.DigitalOcean,
            skip: false
          };
        },
        defaultShow: true,
        showForms: [moduleMap.BasicForm],
        showModules: [],
        providers: []
      },
      {
        title: 'Add Worker Pools',
        content: 'Define the worker pools for your cluster.',
        showButtons: (provider?: ProviderType) => {
          return {
            previous: true,
            next: false,
            save: true,
            skip: false
          };
        },
        defaultShow: false,
        showForms: [moduleMap.WorkerPoolForm],
        showModules: [],
        providers: [ProviderValueMap.DigitalOcean],
        beforeNext: handleBack
      },
      {
        title: 'Add Worker',
        content: 'Add a worker node to your cluster.',
        showButtons: (provider?: ProviderType) => {
          return {
            previous: false,
            next: false,
            save: false,
            skip: true
          };
        },
        defaultShow: false,
        showForms: [],
        showModules: [moduleMap.AddWorkerStep],
        providers: [ProviderValueMap.Custom]
      },
      {
        title: 'Register Cluster',
        content: 'Register your cluster with the chosen provider.',
        showButtons: (provider?: ProviderType) => {
          return {
            previous: false,
            next: false,
            save: false,
            skip: true
          };
        },
        defaultShow: false,
        showForms: [],
        showModules: [moduleMap.AddWorkerStep],
        providers: [ProviderValueMap.Kubernetes]
      }
    ],
    [handleBack]
  );
}
