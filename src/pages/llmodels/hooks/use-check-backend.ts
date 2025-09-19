import _ from 'lodash';
import { backendOptionsMap } from '../config/backend-parameters';

export default function useCheckBackend() {
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
  }) => {
    const { isAudio, gpuOptions, defaultBackend } = data;
    if (isAudio) {
      return backendOptionsMap.voxBox;
    }

    if (checkOnlyAscendNPU(gpuOptions)) {
      return backendOptionsMap.ascendMindie;
    }
    return defaultBackend;
  };

  return {
    checkOnlyAscendNPU,
    checkCurrentbackend
  };
}
