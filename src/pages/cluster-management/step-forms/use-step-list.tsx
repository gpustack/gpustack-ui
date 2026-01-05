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
        title: intl.formatMessage({ id: 'clusters.table.provider' }),
        content: 'Choose where your cluster will run.',
        subTitle: 'Select Provider',
        description:
          'Choose the environment where your cluster will be deployed.',
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
        title: intl.formatMessage({ id: 'common.title.config' }),
        content: 'Configure your cluster settings.',
        description:
          'Set the cluster name, description, or other essential parameters in advanced settings.',
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
        title: intl.formatMessage({ id: 'clusters.button.addNodePool' }),
        content: 'Add worker pools to your cluster.',
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
        title: intl.formatMessage({ id: 'resources.button.create' }),
        content: 'The cluster is created successfully.',
        description:
          'The cluster is now set up and you can add workers to it. You can also add workers later from the cluster list.',
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
        providers: [ProviderValueMap.Docker]
      },
      {
        title: intl.formatMessage({ id: 'clusters.button.register' }),
        content: '',
        description:
          'Register an existing Kubernetes cluster to manage its workers. You can also register a cluster later from the cluster list.',
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
    [handleBack, intl]
  );
}
