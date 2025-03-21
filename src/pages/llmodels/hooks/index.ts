import { queryModelFilesList } from '@/pages/resources/apis';
import { ListItem as WorkerListItem } from '@/pages/resources/config/types';
import _ from 'lodash';
import { useRef } from 'react';
import { queryGPUList } from '../apis';
import { backendOptionsMap, setSourceRepoConfigValue } from '../config';
import { GPUListItem, ListItem } from '../config/types';

export const useGenerateFormEditInitialValues = () => {
  const gpuDeviceList = useRef<any[]>([]);

  const generateCascaderOptions = (list: GPUListItem[]) => {
    const workerFields = new Set(['worker_name', 'worker_id', 'worker_ip']);

    const workersMap = new Map<string, GPUListItem[]>();
    for (const item of list) {
      if (!workersMap.has(item.worker_name)) {
        workersMap.set(item.worker_name, []);
      }
      workersMap.get(item.worker_name)!.push(item);
    }

    const workerList = Array.from(workersMap.entries()).map(
      ([workerName, items]) => {
        const firstItem = items[0];

        return {
          label: workerName,
          value: workerName,
          parent: true,
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

    return workerList;
  };

  const getGPUList = async () => {
    const data = await queryGPUList();
    const gpuList = generateCascaderOptions(data.items);
    gpuDeviceList.current = gpuList;
    return gpuList;
  };

  const generateGPUSelector = (data: any, gpuOptions: any[]) => {
    const gpu_ids = _.get(data, 'gpu_selector.gpu_ids', []);
    if (gpu_ids.length === 0) {
      return [];
    }
    const gpuids: string[][] = [];

    gpuOptions?.forEach((item) => {
      item.children?.forEach((child: any) => {
        if (gpu_ids.includes(child.value)) {
          gpuids.push([item.value, child.value]);
        }
      });
    });

    return data.backend === backendOptionsMap.voxBox ? gpuids[0] : gpuids;
  };

  const generateFormValues = (data: ListItem, gpuOptions: any[]) => {
    const result = setSourceRepoConfigValue(data?.source || '', data);

    const formData = {
      ...result.values,
      ..._.omit(data, result.omits),
      categories: data?.categories?.length ? data.categories[0] : null,
      scheduleType: data?.gpu_selector ? 'manual' : 'auto',
      gpu_selector: data?.gpu_selector?.gpu_ids?.length
        ? {
            gpu_ids: generateGPUSelector(data, gpuOptions)
          }
        : null
    };
    return formData;
  };

  return {
    getGPUList,
    generateFormValues,
    gpuDeviceList
  };
};

export const useGenerateModelFileOptions = () => {
  const getModelFileList = async () => {
    try {
      const res = await queryModelFilesList({ page: 1, perPage: 100 });
      const list = res.items || [];
      return list;
    } catch (error) {
      console.error('Error fetching model file list:', error);
      return [];
    }
  };

  const generateModelFileOptions = (list: any[], workerList: any[]) => {
    const workerFields = new Set(['name', 'id', 'ip', 'status']);
    const workersMap = new Map<number, WorkerListItem>();

    for (const item of workerList) {
      if (!workersMap.has(item.id)) {
        workersMap.set(item.id, item);
      }
    }

    const result = Array.from(workersMap.values()).map((worker) => ({
      label: worker.name,
      value: worker.name,
      parent: true,
      children: list
        .filter((item) => item.worker_id === worker.id)
        .map((item) => {
          const resolved_paths =
            Array.isArray(item.resolved_paths) && item.resolved_paths.length
              ? item.resolved_paths[0].split('/')
              : [];
          const label =
            resolved_paths.length > 0 ? resolved_paths.pop() : 'Unknown File';
          return {
            label: item.resolved_paths[0] || '',
            value: item.resolved_paths[0] || '',
            parent: false,
            ...item
          };
        }),
      ...Object.fromEntries(
        Object.entries(worker).filter(([key]) => workerFields.has(key))
      )
    }));
    return result;
  };

  return {
    getModelFileList,
    generateModelFileOptions
  };
};
