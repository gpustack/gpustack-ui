import { useQueryData } from '@/hooks/use-query-data-list';
import { useIntl } from '@umijs/max';
import { useState } from 'react';
import { queryModelInstanceRestartCount } from '../apis';
import { InstanceRestartCount } from '../config/types';

interface RestartCountOption {
  label: string;
  value: number;
  worker_id: number;
  name: string;
  isParent: boolean;
  children?: {
    value: number;
    label: string;
    start_at: string;
    previous: boolean;
    worker_id: number;
    isCurrent: boolean;
    isPrevious: boolean;
  }[];
}

export default function useQueryModelInstanceRestartCount() {
  const { detailData, loading, cancelRequest, fetchData } =
    useQueryData<InstanceRestartCount>({
      fetchDetail: queryModelInstanceRestartCount,
      key: 'modelInstanceRestartCount'
    });
  const intl = useIntl();
  const [dataList, setDataList] = useState<RestartCountOption[]>([]);

  const fetchRestartCount = async (instance_id: number) => {
    const res = await fetchData(instance_id);

    const list =
      res.workers?.map((worker) => {
        return {
          value: worker.worker_id,
          label: worker.name,
          worker_id: worker.worker_id,
          name: worker.name,
          isMain: res.main_worker_id === worker.worker_id,
          isParent: true,
          children:
            worker.restarts?.map((restart, index) => {
              return {
                value: index,
                previous: restart.previous,
                label:
                  index === 0
                    ? intl.formatMessage({ id: 'models.instance.currentRun' })
                    : intl.formatMessage({ id: 'models.instance.previousRun' }),
                start_at: restart.started_at,
                worker_id: worker.worker_id,
                isCurrent: index === 0,
                isPrevious: index === 1
              };
            }) || []
        };
      }) || [];

    setDataList(list);
    return list;
  };
  return {
    countOptions: dataList,
    loading,
    cancelRequest,
    fetchData: fetchRestartCount
  };
}
