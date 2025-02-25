import _ from 'lodash';
import { useRef } from 'react';
import { queryGPUList } from '../apis';
import { backendOptionsMap, setSourceRepoConfigValue } from '../config';
import { GPUListItem, ListItem } from '../config/types';

export const useGenerateFormEditInitialValues = () => {
  const gpuDeviceList = useRef<any[]>([]);
  const generateCascaderOptions = (list: GPUListItem[]) => {
    const workerFields = ['worker_name', 'worker_id', 'worker_ip'];

    const workers = _.groupBy(list, 'worker_name');

    const workerList = _.map(workers, (value: GPUListItem[]) => {
      return {
        label: `${value[0].worker_name}`,
        value: value[0].worker_name,
        parent: true,
        ..._.pick(value[0], workerFields),
        children: _.map(value, (item: GPUListItem) => {
          return {
            label: `${item.name}`,
            value: item.id,
            ..._.omit(item, workerFields)
          };
        })
      };
    });

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
