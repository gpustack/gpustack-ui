import { useQueryData } from '@/hooks/use-query-data-list';
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
    { value: number; label: React.ReactNode; worker_id: number }[]
  >([]);

  const fetchRestartCount = async (instance_id: number) => {
    const res = await fetchData(instance_id);
    const workerId = res?.workers?.[0]?.worker_id || 0;
    const workerItem = res?.workers?.[0];
    const dataList =
      workerItem?.restarts?.map((restart, index) => {
        return {
          value: restart.restart_count,
          label: restart.restart_count,
          start_at: restart.started_at,
          worker_id: workerId,
          isCurrent: index === 0,
          isPrevious: index === 1
        };
      }) || [];
    setDataList(dataList);
    return dataList;
  };
  return {
    countOptions: dataList,
    loading,
    cancelRequest,
    fetchData: fetchRestartCount
  };
}
