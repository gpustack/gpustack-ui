import { useIntl } from '@umijs/max';
import { message } from 'antd';
import { useRef, useState } from 'react';
import { queryModelInstanceRestartCount } from '../apis';

export interface RestartOption {
  value: string;
  label: string;
  start_at: string | null;
  previous: boolean;
  worker_id: number;
  container: string;
  parentValue: string;
  source?: string;
}

interface RestartCountOption {
  label: string;
  value: string;
  worker_id: number;
  name: string;
  container: string;
  start_at: string | null;
  isParent: boolean;
  isMain: boolean;
  children?: RestartOption[];
}

export default function useQueryModelInstanceRestartCount() {
  const requestRef = useRef<AbortController | null>(null);
  const cancelRequest = () => requestRef.current?.abort();
  const intl = useIntl();
  const [dataList, setDataList] = useState<RestartCountOption[]>([]);

  const fetchRestartCount = async (instance_id: number) => {
    cancelRequest();
    setDataList([]);
    const controller = new AbortController();
    requestRef.current = controller;
    const res = await queryModelInstanceRestartCount(instance_id, {
      signal: controller.signal,
      skipErrorHandler: true
    }).catch((error) => {
      if (controller.signal.aborted) return;
      message.error(
        error.response?.data?.detail ||
          error.response?.data?.message ||
          error.message
      );
    });
    if (controller.signal.aborted || !res) return [];

    const list =
      res.workers?.flatMap((worker) => {
        const containerMap = new Map<string, RestartCountOption>();
        const isMain = res.main_worker_id === worker.worker_id;

        worker.restarts?.forEach((restart, index) => {
          const containers = (restart.containers || []).map((container) => ({
            container,
            key: container,
            source: undefined as string | undefined
          }));
          const smg = restart.sources?.find(
            (source) =>
              source.kind === 'workload' &&
              source.component_kind === 'sglang_smg' &&
              source.available
          );
          if (smg)
            containers.push({
              container: 'SMG',
              key: 'source:sglang_smg',
              source: smg.id
            });
          containers.forEach(({ container, key, source }) => {
            const parentValue = `${worker.worker_id}:${key}`;
            const option = containerMap.get(key) || {
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
              parentValue,
              source
            });
            containerMap.set(key, option);
          });
        });

        return Array.from(containerMap.values());
      }) || [];

    setDataList(list);
    return list;
  };
  return {
    countOptions: dataList,
    cancelRequest,
    fetchData: fetchRestartCount
  };
}
