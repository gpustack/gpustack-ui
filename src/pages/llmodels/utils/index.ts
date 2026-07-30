import _ from 'lodash';
import { ManualGPUModeMap, ScheduleValueMap } from '../config';
import { FormData } from '../config/types';
import { backendOptionsMap } from '../constants/backend-parameters';

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
 * build the gpu_type_selector payload field from the form values. Normalizes
 * the four API keys: a partition profile zeroes the percentages, anything
 * else nulls the profile, missing percentages become 0 (whole card).
 * @param data
 * @returns
 */
export const generateGPUTypeSelector = (data: FormData) => {
  const selector = data.gpu_type_selector;

  if (!selector?.type) {
    return {
      gpu_type_selector: null
    };
  }

  const partitionedProfile = selector.accelerator_partitioned_profile || null;

  return {
    gpu_type_selector: {
      type: selector.type,
      accelerator_sliced_memory_percentage: partitionedProfile
        ? 0
        : _.toNumber(selector.accelerator_sliced_memory_percentage) || 0,
      accelerator_sliced_cores_percentage: partitionedProfile
        ? 0
        : _.toNumber(selector.accelerator_sliced_cores_percentage) || 0,
      accelerator_partitioned_profile: partitionedProfile
    }
  };
};

/**
 * before submit the form, generate the gpu_selector field, and clear worker_selector if needed
 * @param data
 * @returns
 */
export const generateGPUIds = (data: FormData) => {
  // The manual mode's vGPU tab: mutually exclusive with the whole-card
  // gpu_selector — null it and emit gpu_type_selector instead.
  if (
    data.scheduleType === ScheduleValueMap.Manual &&
    data.manualGpuMode === ManualGPUModeMap.VGPU
  ) {
    return {
      gpu_selector: null,
      worker_selector: null,
      ...generateGPUTypeSelector(data)
    };
  }

  const gpu_ids = _.get(data, 'gpu_selector.gpu_ids', []);

  if (!gpu_ids.length) {
    return {
      gpu_selector: null,
      gpu_type_selector: null
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
    worker_selector: null,
    gpu_type_selector: null
  };
};

export const calcTotalVram = (record: any) => {
  const vramInMain = _.sum(
    _.values(record.computed_resource_claim?.vram || {})
  );
  const vramInDistributed = _.sum(
    _.values(record.distributed_servers?.subordinate_workers || []).map(
      (item: any) => _.sum(_.values(item.computed_resource_claim?.vram || {}))
    )
  );
  return vramInMain + vramInDistributed;
};
