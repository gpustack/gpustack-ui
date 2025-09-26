import { useIntl, useNavigate } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { useMemo } from 'react';
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
        title: 'Basic Info',
        content: '',
        showButtons: () => {
          return {
            previous: false,
            next: true,
            save: false,
            skip: false
          };
        },
        defaultShow: true,
        showForms: [moduleMap.BasicForm],
        showModules: []
      },
      {
        title: 'Version Configuration',
        content: '',
        showButtons: () => {
          return {
            previous: true,
            next: true,
            save: false,
            skip: false
          };
        },
        defaultShow: true,
        showForms: [moduleMap.VersionConfigForm],
        showModules: []
      },
      {
        title: 'Parameters',
        content: '',
        showButtons: () => {
          return {
            previous: true,
            next: false,
            save: true,
            skip: false
          };
        },
        defaultShow: true,
        showForms: [moduleMap.ParamertersForm],
        showModules: [],
        beforeNext: handleBack
      }
    ],
    [handleBack, intl]
  );
}
