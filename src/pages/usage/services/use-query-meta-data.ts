import { useQueryData } from '@/hooks/use-query-data-list';
import { useState } from 'react';
import { queryUsageMetaData } from '../apis';
import { UsageFilterItem, UsageMeta } from '../config/types';

type OptionType = UsageFilterItem & {
  value: string;
};

export default function useQueryUsageMetaData() {
  const { detailData, loading, cancelRequest, fetchData } =
    useQueryData<UsageMeta>({
      fetchDetail: queryUsageMetaData,
      key: 'usageMetaData'
    });

  const [result, setResult] = useState<{
    models: OptionType[];
    users: OptionType[];
    api_keys: OptionType[];
  }>({
    models: [],
    users: [],
    api_keys: []
  });

  const queryMetaData = async () => {
    const res = await fetchData({});

    const data = {
      models:
        res?.filters?.models?.map((item) => ({
          value: item.label,
          ...item
        })) || [],
      users:
        res?.filters?.users?.map((item) => ({
          value: item.label,
          ...item
        })) || [],
      api_keys:
        res?.filters?.api_keys?.map((item) => ({
          value: item.label,
          ...item
        })) || []
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
