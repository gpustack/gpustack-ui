import { useQueryData } from '@gpustack/core-ui';
import { useState } from 'react';
import { queryModelLoraAdapter } from '../apis';
import { modelSourceMap } from '../config';
import { ModelLoraAdapterResult } from '../config/types';

type Parameters = {
  base: string;
  q?: string;
  limit?: number; // default to 40
};

export type LoraOptionChild = {
  label: string;
  value: string;
  source: string;
  isParent: false;
};

export type LoraOptionGroup = {
  label: string;
  value: string;
  isParent: true;
  children: LoraOptionChild[];
};

const sourceLabel = (source: string) => {
  if (source === modelSourceMap.huggingface_value) {
    return modelSourceMap.huggingface;
  }
  if (source === modelSourceMap.modelscope_value) {
    return modelSourceMap.modelScope;
  }
  return source;
};

export const useQueryModelLoraList = () => {
  const { detailData, loading, fetchData, cancelRequest } = useQueryData<
    ModelLoraAdapterResult,
    Parameters
  >({
    key: 'modelLoraList',
    fetchDetail: queryModelLoraAdapter
  });

  const [dataList, setDataList] = useState<LoraOptionGroup[]>([]);

  const getData = (params: Parameters) => {
    fetchData({
      ...params,
      limit: params.limit || 40
    }).then((result) => {
      if (result) {
        const groups: Record<string, LoraOptionGroup> = {};
        result.lora_list.forEach((item) => {
          if (!groups[item.source]) {
            groups[item.source] = {
              label: sourceLabel(item.source),
              value: item.source,
              isParent: true,
              children: []
            };
          }
          groups[item.source].children.push({
            label: item.lora_repo_name,
            value: item.lora_repo_name,
            source: item.source,
            isParent: false
          });
        });
        setDataList(Object.values(groups));
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
