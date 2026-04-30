import { useQueryData } from '@gpustack/core-ui';
import { useState } from 'react';
import { queryModelLoraAdapter } from '../apis';
import { ModelLoraAdapterResult } from '../config/types';

type Parameters = {
  base: string;
  q?: string;
  limit?: number; // default to 40
};

export const useQueryModelLoraList = () => {
  const { detailData, loading, fetchData, cancelRequest } = useQueryData<
    ModelLoraAdapterResult,
    Parameters
  >({
    key: 'modelLoraList',
    fetchDetail: queryModelLoraAdapter
  });

  const [dataList, setDataList] = useState<
    {
      label: string;
      value: string;
      lora_repo_name: string;
      source: string;
    }[]
  >([]);

  const getData = (params: Parameters) => {
    fetchData(params).then((result) => {
      if (result) {
        const formattedData = result.lora_list.map((item) => ({
          ...item,
          label: item.lora_repo_name,
          value: item.lora_repo_name
        }));
        setDataList(formattedData);
      }
    });
  };

  return {
    dataList,
    loading,
    fetchData: getData,
    cancelRequest
  };
};

export default useQueryModelLoraList;
