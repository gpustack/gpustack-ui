import { useQueryData } from '@gpustack/core-ui';
import React from 'react';
import { ceilMilliToCore, parseQuantityToGi } from '../../utils';
import { queryGPUServiceInstanceTypes } from '../apis';
import { getAcceleratorMax } from '../config';
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
    if (!item.spec?.acceleratable)
      return {
        maxAccelerator: 0,
        available: true
      };
    const max = getAcceleratorMax(item.status?.acceleratorTiers);
    return {
      maxAccelerator: max || 0,
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
          }
        },
        status: {
          ...item.status,
          onceMaxRequest: {
            ...rawMax,
            cpu: rawMax?.cpu
              ? `${ceilMilliToCore(rawMax.cpu)?.cores || 0}`
              : '',
            ram: rawMax?.ram
              ? `${parseQuantityToGi(rawMax.ram)?.value || 0}`
              : '',
            localStorage: rawMax?.localStorage
              ? `${parseQuantityToGi(rawMax.localStorage)?.value || 0}`
              : ''
          }
        },
        maxAccelerator: remainingData.maxAccelerator,
        disabled: !remainingData.available
      };
    });

    setDataList(list);
    return list;
  };

  return {
    detailData: dataList,
    loading,
    cancelRequest,
    fetchData: queryInstanceTypes
  };
}
