import { useQueryData } from '@/hooks/use-query-data-list';
import { useState } from 'react';
import { queryUsageMetaData } from '../apis';
import { GroupOption, groupToOptions } from '../config';
import { UsageFilterItem, UsageMeta } from '../config/types';

type UserOptionType = UsageFilterItem & {
  value: string;
};

export default function useQueryUsageMetaData() {
  const { detailData, loading, cancelRequest, fetchData } =
    useQueryData<UsageMeta>({
      fetchDetail: queryUsageMetaData,
      key: 'usageMetaData'
    });

  const [result, setResult] = useState<{
    models: GroupOption<UsageFilterItem>[];
    users: UserOptionType[];
    api_keys: GroupOption<UsageFilterItem>[];
  }>({
    models: [],
    users: [],
    api_keys: []
  });

  const queryMetaData = async () => {
    const res = await fetchData({});

    const data = {
      models: groupToOptions(res?.filters?.models || [], {
        getGroupKey: (item) => item.identity.value.provider_name || 'gpustack',
        getGroupType: (item) =>
          item.identity.value.provider_type || 'deployments',
        getChild: (item) => ({
          ...item,
          value: item.label,
          label: item.identity.value.model_name || ''
        })
      }),
      users:
        res?.filters?.users?.map((item) => ({
          value: item.label,
          ...item
        })) || [],
      api_keys: groupToOptions(res?.filters?.api_keys || [], {
        getGroupKey: (item) => item.identity.value.user_name || 'unknown_user',
        getGroupType: (item) =>
          item.identity.value.api_key_is_custom ? 'custom' : 'default',
        getChild: (item) => ({
          ...item,
          value: item.label,
          label: item.identity.value.api_key_name || ''
        })
      })
    };
    setResult(data);
  };

  return {
    detailData: result,
    loading,
    cancelRequest,
    fetchData: queryMetaData
  };
}
