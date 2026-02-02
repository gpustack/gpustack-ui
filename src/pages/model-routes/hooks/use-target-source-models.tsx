import { queryModelsList } from '@/pages/llmodels/apis';
import { ListItem as ModelListItem } from '@/pages/llmodels/config/types';
import { queryMaasProviders } from '@/pages/maas-provider/apis';
import { MaasProviderItem } from '@/pages/maas-provider/config/types';
import { useIntl } from '@umijs/max';
import { useState } from 'react';

type EmptyObject = Record<never, never>;
type CascaderOption<T extends object = EmptyObject> = {
  label: string;
  value: string | number;
  parent?: boolean;
  disabled?: boolean;
  index?: number;
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
          label: (
            <span>
              {intl.formatMessage({ id: 'menu.models.deployment' })}
              <span
                style={{
                  color: 'var(--ant-color-text-tertiary)',
                  marginLeft: 4
                }}
              >
                [GPUStack]
              </span>
            </span>
          ),
          value: 'deployments',
          parent: true,
          children: models.items?.map?.((model: ModelListItem) => ({
            label: model.name,
            value: model.id,
            data: {
              model_id: model.id
            },
            source: 'deployment'
          }))
        }
      ].filter((group) => group.children && group.children.length > 0);

      const providerOptions: CascaderOption[] = providers.items
        ?.map?.((provider: MaasProviderItem) => ({
          label: provider.name,
          value: provider.id,
          parent: true,
          children: provider.models?.map?.((model) => ({
            label: model.name,
            value: model.name,
            data: {
              provider_model_name: model.name,
              provider_id: provider.id
            },
            source: 'providerModel'
          }))
        }))
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
