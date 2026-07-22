import { useQueryData } from '@gpustack/core-ui';
import React from 'react';
import { ceilMilliToCore, parseQuantityToGi } from '../../utils';
import { queryGPUServiceInstanceTypes } from '../apis';
import { getAcceleratorMax, isSliceableDetail } from '../config';
import { InstanceTypeItem } from '../config/types';

type InstanceType = InstanceTypeItem & {
  disabled?: boolean;
};

export default function useQueryInstanceTypes() {
  const fetchDetail = (
    params: Global.SearchParams = { page: 1, perPage: 100 },
    options?: any
  ) => queryGPUServiceInstanceTypes(params, options);

  const { detailData, loading, cancelRequest, fetchData } = useQueryData<
    Global.PageResponse<InstanceTypeItem>,
    Global.SearchParams
  >({
    fetchDetail,
    key: 'instanceTypes'
  });

  const [dataList, setDataList] = React.useState<InstanceType[]>([]);

  const isAvailable = (item: InstanceTypeItem) => {
    if (!item.spec?.acceleratable) {
      const max =
        ceilMilliToCore(item.status?.onceMaxRequest?.cpu || '0')?.cores || 0;
      return {
        maxComputeUnitCount: max, // CPU resource max request
        available: max > 0
      };
    }

    const max = getAcceleratorMax(item.status?.tiers);

    // Sliceable types stay selectable as long as either whole-card or sliced
    // capacity remains; unavailable only when both status.onceMaxRequest
    // .accelerator and .acceleratorSliced are 0.
    if (isSliceableDetail(item.status?.detail?.slicedDetail)) {
      const wholeMax = Number(item.status?.onceMaxRequest?.accelerator) || 0;
      const slicedMax =
        Number(item.status?.onceMaxRequest?.acceleratorSliced) || 0;
      return {
        maxComputeUnitCount: max || 0,
        available: wholeMax > 0 || slicedMax > 0
      };
    }

    return {
      maxComputeUnitCount: max || 0,
      available: (max || 0) > 0
    };
  };

  const queryInstanceTypes = async (
    params: Global.SearchParams = { page: -1 }
  ) => {
    const res = await fetchData(params);

    const list = (res?.items || []).map((item) => {
      const remainingData = isAvailable(item);
      const rawMax = item.status?.onceMaxRequest;

      return {
        ...item,
        spec: {
          ...item.spec,
          unitResourcesParsed: {
            cpu: ceilMilliToCore(item.spec?.unitResources?.cpu ?? null),
            ram: parseQuantityToGi(item.spec?.unitResources?.ram ?? null)
          },
          maxComputeUnitCount: remainingData.maxComputeUnitCount
        },
        status: {
          ...item.status,
          // Normalize cpu (possibly millicores) to a whole-core count string;
          // the other onceMaxRequest fields are plain number strings already.
          onceMaxRequest: {
            ...rawMax,
            cpu: rawMax?.cpu ? `${ceilMilliToCore(rawMax.cpu)?.cores || 0}` : ''
          }
        },

        disabled: !remainingData.available
      };
    });

    setDataList(list);
    return list;
  };

  return {
    detailData: dataList,
    setDataList,
    loading,
    cancelRequest,
    fetchData: queryInstanceTypes
  };
}
