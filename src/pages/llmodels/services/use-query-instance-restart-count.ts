import { useQueryData } from '@/hooks/use-query-data-list';
import { useIntl } from '@umijs/max';
import { useState } from 'react';
import { queryModelInstanceRestartCount } from '../apis';
import { InstanceRestartCount } from '../config/types';

interface RestartCountOption {
  label: string;
  value: string;
  worker_id: number;
  name: string;
  container: string;
  start_at: string;
  isParent: boolean;
  isMain: boolean;
  children?: {
    value: string;
    label: string;
    start_at: string;
    previous: boolean;
    worker_id: number;
    container: string;
    parentValue: string;
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
      res.workers?.flatMap((worker) => {
        const containerMap = new Map<string, RestartCountOption>();
        const isMain = res.main_worker_id === worker.worker_id;

        worker.restarts?.forEach((restart, index) => {
          restart.containers?.forEach((container) => {
            const parentValue = `${worker.worker_id}:${container}`;
            const option = containerMap.get(container) || {
              value: parentValue,
              label: `${container}:${worker.name}`,
              worker_id: worker.worker_id,
              name: worker.name,
              container,
              start_at: restart.started_at,
              isMain,
              isParent: true,
              children: []
            };

            if (!restart.previous) {
              option.start_at = restart.started_at;
            }

            option.children?.push({
              value: `${parentValue}:${index}`,
              previous: restart.previous,
              label: restart.previous
                ? intl.formatMessage({ id: 'models.instance.previousRun' })
                : intl.formatMessage({ id: 'models.instance.currentRun' }),
              start_at: restart.started_at,
              worker_id: worker.worker_id,
              container,
              parentValue
            });
            containerMap.set(container, option);
          });
        });

        return Array.from(containerMap.values());
      }) || [];

    console.log('restart count list: ', list);
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
