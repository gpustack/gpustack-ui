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
        title: intl.formatMessage({ id: 'clusters.create.selectProvider' }),
        content: '',
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
        title: intl.formatMessage({ id: 'clusters.create.configBasic' }),
        content: '',
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
        content: '',
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
        content: '',
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
        title: intl.formatMessage({ id: 'clusters.button.register' }),
        content: '',
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
