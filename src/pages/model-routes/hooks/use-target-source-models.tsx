import { queryModelsList } from '@/pages/llmodels/apis';
import { ListItem as ModelListItem } from '@/pages/llmodels/config/types';
import { queryMaasProviders } from '@/pages/maas-provider/apis';
import { MaasProviderItem } from '@/pages/maas-provider/config/types';
import { useIntl } from '@umijs/max';
import _ from 'lodash';
import React, { useState } from 'react';
import styled from 'styled-components';

const OptionWrapper = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
`;

type EmptyObject = Record<never, never>;
type CascaderOption<T extends object = EmptyObject> = {
  label: React.ReactNode;
  value: string | number;
  parent?: boolean;
  disabled?: boolean;
  index?: number;
  data?: {
    [key: string]: any;
    parentId?: string | number;
  };
  children?: CascaderOption<T>[];
} & Partial<T>;

const useTargetSourceModels = () => {
  const intl = useIntl();
  const [sourceModels, setSourceModels] = useState<CascaderOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchSourceModels = async (params?: any) => {
    setLoading(true);
    try {
      const [models, providers] = await Promise.all([
        queryModelsList({ page: -1, ...params }),
        queryMaasProviders({ page: -1, ...params })
      ]);

      const modelsList = [
        {
          label: intl.formatMessage({ id: 'menu.models.deployment' }),
          value: 'deployments',
          providerType: 'deployments',
          parent: false,
          isParent: true,
          children: _.uniqBy(
            models.items?.map?.((model: ModelListItem) => ({
              label: model.name,
              value: model.id,
              data: {
                model_id: model.id,
                parentId: 'deployments'
              },
              source: 'deployment'
            })),
            'value'
          )
        }
      ].filter((group) => group.children && group.children.length > 0);

      const providerOptions: CascaderOption[] = providers.items
        ?.map?.((provider: MaasProviderItem) => {
          const children = provider.models?.map?.((model) => ({
            label: model.name,
            value: model.name,
            data: {
              provider_model_name: model.name,
              provider_id: provider.id,
              parentId: provider.id
            },
            source: 'providerModel'
          }));

          return {
            label: provider.name,
            value: provider.id,
            parent: false,
            isParent: true,
            providerType: provider.config?.type,
            children: _.uniqBy(children, 'value')
          };
        })
        .filter((group) => group.children && group.children.length > 0);

      setSourceModels([...modelsList, ...providerOptions]);
    } catch (error) {
      setSourceModels([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    sourceModels,
    loading,
    fetchSourceModels
  };
};

export default useTargetSourceModels;
