import { clusterListAtom, workerListAtom } from '@/atoms/models';
import { queryClusterList } from '@/pages/cluster-management/apis';
import { ClusterListItem } from '@/pages/cluster-management/config/types';
import { queryWorkersList } from '@/pages/resources/apis';
import {
  WorkerStatusMap,
  WorkerStatusMapValue
} from '@/pages/resources/config';
import { ListItem as WorkerListItem } from '@/pages/resources/config/types';
import { useAtom } from 'jotai';
import { useState } from 'react';
import { queryGPUList } from '../apis';
import { ScheduleValueMap } from '../config';
import { GPUListItem, ListItem } from '../config/types';

type EmptyObject = Record<never, never>;

export type CascaderOption<T extends object = EmptyObject> = {
  label: string;
  value: string | number;
  parent?: boolean;
  disabled?: boolean;
  index?: number;
  children?: CascaderOption<T>[];
} & Partial<T>;

export const useGenerateGPUOptions = () => {
  const [gpuOptions, setGpuOptions] = useState<CascaderOption[]>([]);
  const [workerLabelOptions, setWorkerLabelOptions] = useState<
    CascaderOption[]
  >([]);

  const generateCascaderGPUOptions = (
    gpuList: GPUListItem[],
    workerList: WorkerListItem[]
  ) => {
    // pick the worker fields from gpuList
    const workerFields = new Set(['worker_name', 'worker_id', 'worker_ip']);

    // generate a map for workerList by name to data
    const workerDataMap = new Map<string, WorkerListItem>();
    for (const worker of workerList) {
      workerDataMap.set(worker.name, worker);
    }

    const workersMap = new Map<string, GPUListItem[]>();
    for (const gpu of gpuList) {
      if (!workersMap.has(gpu.worker_name)) {
        workersMap.set(gpu.worker_name, []);
      }
      workersMap.get(gpu.worker_name)!.push(gpu);
    }

    const gpuSelectorList = Array.from(workersMap.entries()).map(
      ([workerName, items]) => {
        const firstItem = items[0];
        const currentState = workerDataMap.get(workerName)?.state || '';
        const disDisabled = WorkerStatusMap.ready !== currentState;
        return {
          label: disDisabled
            ? `${workerName} [${WorkerStatusMapValue[currentState]}]`
            : workerName,
          value: workerName,
          parent: true,
          disabled: disDisabled,
          children: items
            .map((item) => ({
              label: item.name,
              value: item.id,
              index: item.index,
              ...Object.fromEntries(
                Object.entries(item).filter(([key]) => !workerFields.has(key))
              )
            }))
            .sort((a, b) => a.index - b.index),
          ...Object.fromEntries(
            Object.entries(firstItem).filter(([key]) => workerFields.has(key))
          )
        };
      }
    );

    return gpuSelectorList;
  };

  const generateWorkerSelectorOptions = (workerList: WorkerListItem[]) => {
    // each worker may have multiple labels,the labels is object as: {key: value, key2: value2}
    // different workers may have a same label key but different values
    // we need to extract a list as: [{label: key, value: key, children: [{label: value, value: value}]}]
    const labelMap = new Map<string, Set<string>>();
    workerList.forEach((worker) => {
      const labels = worker.labels || {};
      Object.entries(labels).forEach(([key, value]) => {
        if (!labelMap.has(key)) {
          labelMap.set(key, new Set());
        }
        labelMap.get(key)!.add(value);
      });
    });

    const labelOptions: CascaderOption[] = Array.from(labelMap.entries()).map(
      ([key, values]) => ({
        label: key,
        value: key,
        parent: true,
        children: Array.from(values).map((value) => ({
          label: value,
          value: value
        }))
      })
    );
    return labelOptions;
  };

  const getGPUOptionList = async (params?: {
    clusterId: number;
  }): Promise<CascaderOption[]> => {
    const { clusterId } = params || {};
    const [gpuData, workerData] = await Promise.all([
      queryGPUList({
        page: -1,
        cluster_id: clusterId
      }),
      queryWorkersList({
        page: -1,
        cluster_id: clusterId
      })
    ]);
    const gpuList = generateCascaderGPUOptions(gpuData.items, workerData.items);
    const labelOptions = generateWorkerSelectorOptions(workerData.items);
    setGpuOptions(gpuList);
    setWorkerLabelOptions(labelOptions);
    return gpuList;
  };

  return {
    getGPUOptionList,
    gpuOptions,
    workerLabelOptions
  };
};

export const useGenerateWorkerOptions = () => {
  const [workerOptions, setWorkerOptions] = useState<
    CascaderOption<{ state: string }>[]
  >([]);
  const [clusterList, setClusterList] = useState<
    Global.BaseOption<number, { provider: string; state: string | number }>[]
  >([]);
  const [workersList, setWorkersList] = useState<
    Global.BaseOption<
      number,
      { state: string; labels: Record<string, string>; cluster_id: number }
    >[]
  >([]);
  const [, setClusterListAtom] = useAtom(clusterListAtom);
  const [, setWorkerListAtom] = useAtom(workerListAtom);

  const generateCascaderWorkerOptions = (
    workerList: WorkerListItem[],
    clusterList: ClusterListItem[]
  ) => {
    const options = clusterList
      .map((cluster) => ({
        label: cluster.name,
        value: cluster.id,
        parent: true,
        children: workerList
          .filter(
            (worker) =>
              worker.cluster_id === cluster.id &&
              worker.state === WorkerStatusMap.ready
          )
          .map((worker) => ({
            disabled: WorkerStatusMap.ready !== worker.state,
            state: worker.state,
            label: worker.name,
            value: worker.id
          }))
      }))
      .filter((cluster) => cluster.children.length > 0); // Filter out clusters with no workers
    setWorkerOptions(options);
    return options;
  };

  const getDataList = async (): Promise<
    [WorkerListItem[], ClusterListItem[]]
  > => {
    const [workerRes, clusterRes] = await Promise.all([
      queryWorkersList({
        page: -1
      }),
      queryClusterList({
        page: -1
      })
    ]);
    const workerList = workerRes.items || ([] as WorkerListItem[]);
    const clusterList = clusterRes.items || ([] as ClusterListItem[]);
    return [workerList, clusterList];
  };

  const getWorkerOptionList = async () => {
    const data = await getDataList();
    const [workerList, clusterList] = data;
    generateCascaderWorkerOptions(workerList, clusterList);

    const workerOptions = workerList.map((item) => ({
      cluster_id: item.cluster_id,
      state: item.state,
      label: item.name,
      value: item.id,
      id: item.id,
      labels: item.labels || {},
      name: item.name
    }));
    const clusterOptions = clusterList.map((item) => ({
      label: item.name,
      value: item.id,
      provider: item.provider as string,
      state: item.state,
      is_default: item.is_default,
      workers: item.workers,
      ready_workers: item.ready_workers,
      gpus: item.gpus
    }));

    setWorkersList(workerOptions);
    setClusterList(clusterOptions);
    setWorkerListAtom(workerOptions);
    setClusterListAtom(clusterOptions);
  };
  return {
    getWorkerOptionList,
    workerOptions,
    clusterList,
    workersList
  };
};

export default function useFormInitialValues() {
  const { getGPUOptionList, gpuOptions } = useGenerateGPUOptions();
  const [, setClusterListAtom] = useAtom(clusterListAtom);
  const [, setWorkerListAtom] = useAtom(workerListAtom);

  const [clusterList, setClusterList] = useState<
    Global.BaseOption<
      number,
      { provider: string; state: string; is_default: boolean }
    >[]
  >([]);

  const [workerList, setWorkerList] = useState<WorkerListItem[]>([]);

  const getClusterList = async (): Promise<Global.BaseOption<number>[]> => {
    try {
      const response = await queryClusterList({
        page: -1
      });
      const list = response.items.map((item) => ({
        label: item.name,
        value: item.id,
        provider: item.provider as string,
        state: item.state,
        is_default: item.is_default,
        workers: item.workers,
        ready_workers: item.ready_workers,
        gpus: item.gpus
      }));
      setClusterList(list);
      setClusterListAtom(list);
      return list;
    } catch (error) {
      console.error('Failed to fetch cluster list:', error);
      setClusterList([]);
      setClusterListAtom([]);
      return [];
    }
  };

  // get worker list
  const getWorkerList = async (): Promise<any> => {
    try {
      const data = await queryWorkersList({ page: -1 });
      const list =
        data.items?.map((item) => ({
          label: item.name,
          value: item.id,
          cluster_id: item.cluster_id,
          state: item.state,
          id: item.id,
          labels: item.labels || {},
          name: item.name
        })) || [];
      setWorkerList(data.items);
      setWorkerListAtom(list);
      return data;
    } catch (error) {
      // ingore
      setWorkerList([]);
      setWorkerListAtom([]);
      return {};
    }
  };

  /**
   * before set the form initial values, generate the form values
   * @param data
   * @param gpuOptions
   * @returns
   */
  const generateFormValues = (data: ListItem, gpuOptions: any[]) => {
    const formData = {
      ...data,
      categories: data?.categories?.length ? data.categories[0] : null,
      scheduleType: data?.gpu_selector
        ? ScheduleValueMap.Manual
        : ScheduleValueMap.Auto
    };
    return formData;
  };

  return {
    getGPUOptionList,
    generateFormValues,
    getClusterList,
    getWorkerList,
    workerList,
    clusterList,
    gpuOptions
  };
}
