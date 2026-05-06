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
  if (source === modelSourceMap.local_path_value) {
    return modelSourceMap.local_path;
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
          const groupKey =
            item.is_local || item.source === modelSourceMap.local_path_value
              ? modelSourceMap.local_path_value
              : item.source;
          if (!groups[groupKey]) {
            groups[groupKey] = {
              label: sourceLabel(groupKey),
              value: groupKey,
              isParent: true,
              children: []
            };
          }
          groups[groupKey].children.push({
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
