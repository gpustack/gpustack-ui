import { useQueryData } from '@gpustack/core-ui';
import React from 'react';
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
    if (!item.spec?.acceleratable) return true;
    return getAcceleratorMax(item.status?.acceleratorTiers) > 0;
  };

  const queryInstanceTypes = async (
    params: Global.SearchParams = { page: -1 }
  ) => {
    const res = await fetchData(params);

    const list = (res?.items || []).map((item) => ({
      ...item,
      disabled: !isAvailable(item)
    }));
    console.log('queryInstanceTypes', list);
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
