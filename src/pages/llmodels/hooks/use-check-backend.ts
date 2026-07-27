import _ from 'lodash';
import {
  HuggingFaceTaskMap,
  ModelscopeTaskMap,
  modelSourceMap,
  modelTaskMap
} from '../config';
import { backendOptionsMap } from '../constants/backend-parameters';

export default function useCheckBackend() {
  const checkBackendAvailable = (
    backend: string,
    flatBackendOptions?: Array<{ value: string; enabled?: boolean }>
  ) => {
    if (!flatBackendOptions?.length) {
      return true;
    }
    return flatBackendOptions.some(
      (item) => item.value === backend && item.enabled !== false
    );
  };

  const checkIsImageModel = (model: any, source?: string) => {
    const task = model?.task;
    const categories = model?.categories || [];
    if (
      model?.image_only ||
      categories.includes(modelTaskMap.image) ||
      categories.includes(modelTaskMap.textToImage)
    ) {
      return true;
    }
    if (source === modelSourceMap.huggingface_value) {
      return task === HuggingFaceTaskMap[modelTaskMap.textToImage];
    }
    if (source === modelSourceMap.modelscope_value) {
      return task === ModelscopeTaskMap[modelTaskMap.textToImage];
    }
    return task === modelTaskMap.textToImage || task === modelTaskMap.image;
  };

  // handle for ascend npu only
  const checkOnlyAscendNPU = (gpuOptions: any[]) => {
    if (!gpuOptions?.length) {
      return false;
    }
    return gpuOptions?.every?.((item) => {
      if (!item.children?.length) {
        return false;
      }
      return item.children?.every((child: any) => {
        return _.toLower(child.vendor) === 'huawei';
      });
    });
  };

  const checkCurrentbackend = (data: {
    isAudio: boolean;
    isGGUF: boolean;
    gpuOptions: any[];
    defaultBackend?: string;
    isImage?: boolean;
    flatBackendOptions?: Array<{ value: string; enabled?: boolean }>;
  }) => {
    const {
      isAudio,
      isGGUF,
      isImage,
      gpuOptions,
      defaultBackend,
      flatBackendOptions
    } = data;
    if (isAudio) {
      // audio model use vllm backend by default
      return backendOptionsMap.vllm;
    }

    if (
      isImage &&
      !isGGUF &&
      checkBackendAvailable(backendOptionsMap.diffSynth, flatBackendOptions)
    ) {
      return backendOptionsMap.diffSynth;
    }

    if (checkOnlyAscendNPU(gpuOptions)) {
      return backendOptionsMap.ascendMindie;
    }
    return defaultBackend;
  };

  return {
    checkOnlyAscendNPU,
    checkBackendAvailable,
    checkIsImageModel,
    checkCurrentbackend
  };
}
