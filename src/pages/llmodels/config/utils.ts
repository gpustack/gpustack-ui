import _ from 'lodash';
import { backendOptionsMap } from '../config/backend-parameters';
import { FormData } from './types';

// generate the gpu_selector field for form initial values, when eidting a model
export const generateGPUSelector = (data: any, gpuOptions: any[]) => {
  const gpu_ids = _.get(data, 'gpu_selector.gpu_ids', []);
  if (gpu_ids.length === 0) {
    return {
      gpu_selector: null
    };
  }

  const valueMap = new Map<string, string>();
  gpuOptions?.forEach((item) => {
    item.children?.forEach((child: any) => {
      valueMap.set(child.value, item.value);
    });
  });

  const gpuids: string[][] = gpu_ids
    .map((id: string) => {
      const parent = valueMap.get(id);
      return parent ? [parent, id] : null;
    })
    .filter(Boolean) as string[][];

  const result = data.backend === backendOptionsMap.voxBox ? gpuids[0] : gpuids;

  return {
    gpu_selector: {
      gpu_ids: result
    }
  };
};

/**
 * before submit the form, generate the gpu_selector field, and clear worker_selector if needed
 * @param data
 * @returns
 */
export const generateGPUIds = (data: FormData) => {
  const gpu_ids = _.get(data, 'gpu_selector.gpu_ids', []);

  if (!gpu_ids.length) {
    return {
      gpu_selector: null
    };
  }

  const result = _.reduce(
    gpu_ids,
    (acc: string[], item: string | string[], index: number) => {
      if (Array.isArray(item)) {
        acc.push(item[1]);
      } else if (index === 1) {
        acc.push(item);
      }
      return acc;
    },
    []
  );

  return {
    gpu_selector: {
      gpu_ids: result || [],
      gpus_per_replica: data.gpu_selector?.gpus_per_replica || null
    },
    worker_selector: null
  };
};
