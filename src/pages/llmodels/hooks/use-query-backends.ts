import { backendOptionsAtom } from '@/atoms/models';
import {
  BackendSourceLabelMap,
  BackendSourceValueMap
} from '@/pages/backends/config';
import { useIntl } from '@umijs/max';
import { useAtom } from 'jotai';
import _ from 'lodash';
import { useState } from 'react';
import { queryBackendList } from '../apis';
import { backendOptionsMap } from '../config/backend-parameters';
import { BackendOption } from '../config/types';

interface BackendGroup {
  label: string;
  value: string;
  title?: string;
  children: BackendOption[];
}

const groupByBackendSource = (list: BackendOption[]): BackendGroup[] => {
  const map = list.reduce<Record<string, BackendOption[]>>((acc, item) => {
    const key = item.backend_source;

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(item);
    return acc;
  }, {});

  return Object.entries(map).map(([backend_source, backends]) => ({
    label: backend_source,
    value: backend_source,
    title:
      backend_source === BackendSourceValueMap.CUSTOM
        ? BackendSourceLabelMap[BackendSourceValueMap.USER_DEFINED]
        : BackendSourceLabelMap[backend_source],
    isLeaf: false,
    children: backends
  }));
};

export default function useQueryBackends() {
  const [backendOptions, setBackendOptions] = useAtom(backendOptionsAtom);
  const [flatBackendOptions, setFlatBackendOptions] = useState<BackendOption[]>(
    []
  );
  const intl = useIntl();

  const getBackendOptions = async (params?: { cluster_id: number }) => {
    try {
      const res = await queryBackendList(params);
      const list: BackendOption[] = res?.items?.map((item) => {
        return {
          ..._.pick(item, [
            'enabled',
            'default_version',
            'backend_source',
            'is_built_in',
            'default_backend_param'
          ]),
          backend_source: item.backend_source || BackendSourceValueMap.CUSTOM,
          value: item.backend_name,
          label:
            item.backend_name === backendOptionsMap.custom
              ? intl.formatMessage({ id: 'backend.custom' })
              : item.backend_name,
          title:
            item.backend_name === backendOptionsMap.custom
              ? intl.formatMessage({ id: 'backend.custom' })
              : item.backend_name.replace(/-custom$/, ''),
          isBuiltIn: item.is_built_in,
          isLeaf: true,
          versions: (item.versions || []).map((vItem, index) => ({
            label: vItem.version,
            value: vItem.version,
            is_deprecated: vItem.is_deprecated,
            title: vItem.version.replace(/-custom$/, '')
          }))
        };
      });

      const groupList = groupByBackendSource(list);
      setFlatBackendOptions(list);
      setBackendOptions(groupList);

      console.log('Fetched backend options:', list, groupList);

      return groupList || [];
    } catch (error) {
      // ignore
      setBackendOptions([]);
      setFlatBackendOptions([]);
      return [];
    }
  };

  return {
    backendOptions,
    flatBackendOptions,
    getBackendOptions
  };
}
