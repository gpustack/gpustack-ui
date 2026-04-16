import { useQueryData } from '@/hooks/use-query-data-list';
import { formatOrdinal } from '@/utils';
import { useIntl } from '@umijs/max';
import { useState } from 'react';
import { queryModelInstanceRestartCount } from '../apis';
import { InstanceRestartCount } from '../config/types';

export default function useQueryModelInstanceRestartCount() {
  const { detailData, loading, cancelRequest, fetchData } =
    useQueryData<InstanceRestartCount>({
      fetchDetail: queryModelInstanceRestartCount,
      key: 'modelInstanceRestartCount'
    });
  const intl = useIntl();

  const [dataList, setDataList] = useState<
    { value: number; label: number | string; worker_id: number }[]
  >([]);

  const fetchRestartCount = async (instance_id: number) => {
    const res = await fetchData(instance_id);
    const workerId = res?.workers?.[0]?.id || 0;
    const dataList =
      res?.restart_counts?.map((count, index) => {
        return {
          value: count,
          label:
            count === 0
              ? intl.formatMessage({ id: 'models.instance.firstStart' })
              : formatOrdinal(count),
          worker_id: workerId
        };
      }) || [];
    setDataList(dataList);
  };
  return {
    countOptions: dataList,
    loading,
    cancelRequest,
    fetchData: fetchRestartCount
  };
}
