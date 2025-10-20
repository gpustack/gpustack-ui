import { clusterListAtom } from '@/atoms/models';
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
import { gpusCountTypeMap, ScheduleValueMap } from '../config';
import { GPUListItem, ListItem } from '../config/types';

type EmptyObject = Record<never, never>;

type CascaderOption<T extends object = EmptyObject> = {
  label: string;
  value: string | number;
  parent?: boolean;
  disabled?: boolean;
  index?: number;
  children?: CascaderOption<T>[];
} & Partial<T>;

export const useGenerateGPUOptions = () => {
  const [gpuOptions, setGpuOptions] = useState<CascaderOption[]>([]);

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

  const getGPUOptionList = async (params?: {
    clusterId: number;
  }): Promise<CascaderOption[]> => {
    const { clusterId } = params || {};
    const [gpuData, workerData] = await Promise.all([
      queryGPUList({
        page: 1,
        perPage: 100,
        cluster_id: clusterId
      }),
      queryWorkersList({
        page: 1,
        perPage: 100,
        cluster_id: clusterId
      })
    ]);
    const gpuList = generateCascaderGPUOptions(gpuData.items, workerData.items);
    setGpuOptions(gpuList);
    return gpuList;
  };

  return {
    getGPUOptionList,
    gpuOptions
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
        page: 1,
        perPage: 100
      }),
      queryClusterList({
        page: 1,
        perPage: 100
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
    setWorkersList(
      workerList.map((item) => ({
        cluster_id: item.cluster_id,
        state: item.state,
        label: item.name,
        value: item.id
      }))
    );
    setClusterList(
      clusterList.map((item) => ({
        label: item.name,
        value: item.id,
        provider: item.provider as string,
        state: item.state
      }))
    );
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

  const [clusterList, setClusterList] = useState<
    Global.BaseOption<number, { provider: string; state: string | number }>[]
  >([]);

  const getClusterList = async (): Promise<Global.BaseOption<number>[]> => {
    try {
      const response = await queryClusterList({
        page: 1,
        perPage: 100
      });
      const list = response.items.map((item) => ({
        label: item.name,
        value: item.id,
        provider: item.provider as string,
        state: item.state
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
        : ScheduleValueMap.Auto,
      gpusCountType: data?.gpu_selector?.gpus_per_replica
        ? gpusCountTypeMap.Custom
        : gpusCountTypeMap.Auto
    };
    return formData;
  };

  return {
    getGPUOptionList,
    generateFormValues,
    getClusterList,
    clusterList,
    gpuOptions
  };
}
