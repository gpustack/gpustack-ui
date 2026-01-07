import { useIntl, useNavigate } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { useMemo } from 'react';
import { ProviderType, ProviderValueMap } from '../config';
import { moduleMap } from './module-registry';

export default function useStepList() {
  const intl = useIntl();
  const navigate = useNavigate();

  const handleBack = useMemoizedFn(() => {
    navigate(-1);
  });

  return useMemo(
    () => [
      {
        title: intl.formatMessage({
          id: 'clusters.create.steps.selectProvider'
        }),
        content: '',
        subTitle: '',
        description:
          'Choose the environment where your cluster will be deployed.',
        showButtons: (provider?: ProviderType) => {
          return {
            previous: false,
            next: true,
            save: false,
            skip: false,
            done: false
          };
        },
        defaultShow: true,
        showForms: [],
        showModules: [moduleMap.ProviderCatalog],
        providers: []
      },
      {
        title: intl.formatMessage({ id: 'clusters.create.steps.configure' }),
        content: '',
        description:
          'Set the cluster name, description, or other essential parameters in advanced settings.',
        showButtons: (provider?: ProviderType) => {
          return {
            previous: true,
            next: provider === ProviderValueMap.DigitalOcean,
            save: provider !== ProviderValueMap.DigitalOcean,
            skip: false,
            done: false
          };
        },
        defaultShow: true,
        showForms: [moduleMap.BasicForm],
        showModules: [],
        providers: []
      },
      {
        title: intl.formatMessage({ id: 'clusters.button.addNodePool' }),
        content: '',
        showButtons: (provider?: ProviderType) => {
          return {
            previous: true,
            next: false,
            save: true,
            skip: false,
            done: false
          };
        },
        defaultShow: false,
        showForms: [moduleMap.WorkerPoolForm],
        showModules: [],
        providers: [ProviderValueMap.DigitalOcean],
        beforeNext: handleBack
      },
      {
        title: intl.formatMessage({ id: 'clusters.create.steps.complete' }),
        content: '',
        description: '',
        showButtons: (provider?: ProviderType) => {
          return {
            previous: false,
            next: false,
            save: false,
            skip: true,
            done: false
          };
        },
        defaultShow: false,
        showForms: [],
        showModules: [moduleMap.SuccessResult],
        providers: [ProviderValueMap.Docker, ProviderValueMap.Kubernetes]
      },
      {
        title: intl.formatMessage({ id: 'resources.button.create' }),
        content: '',
        description: '',
        showButtons: (provider?: ProviderType) => {
          return {
            previous: false,
            next: false,
            save: false,
            skip: false,
            done: true
          };
        },
        defaultShow: false,
        hideInSteps: true,
        showForms: [],
        showModules: [moduleMap.AddWorkerStep],
        providers: [ProviderValueMap.Docker]
      },
      {
        title: intl.formatMessage({ id: 'clusters.button.register' }),
        content: '',
        description: '',
        showButtons: (provider?: ProviderType) => {
          return {
            previous: false,
            next: false,
            save: false,
            skip: false,
            done: true
          };
        },
        defaultShow: false,
        hideInSteps: true,
        showForms: [],
        showModules: [moduleMap.AddWorkerStep],
        providers: [ProviderValueMap.Kubernetes]
      }
    ],
    [handleBack, intl]
  );
}
