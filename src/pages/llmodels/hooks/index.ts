import { createAxiosToken } from '@/hooks/use-chunk-request';
import { queryModelFilesList, queryWorkersList } from '@/pages/resources/apis';
import {
  WorkerStatusMap,
  WorkerStatusMapValue
} from '@/pages/resources/config';
import { ListItem as WorkerListItem } from '@/pages/resources/config/types';
import { convertFileSize } from '@/utils';
import { useIntl } from '@umijs/max';
import { useDebounceFn } from 'ahooks';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { evaluationsModelSpec, queryGPUList } from '../apis';
import {
  backendOptionsMap,
  getSourceRepoConfigValue,
  modelSourceMap,
  modelTaskMap,
  setSourceRepoConfigValue
} from '../config';
import { handleRecognizeAudioModel } from '../config/audio-catalog';
import {
  EvaluateResult,
  FormData,
  GPUListItem,
  ListItem
} from '../config/types';

export type MessageStatus = {
  show: boolean;
  title?: string;
  type?: Global.MessageType;
  isHtml?: boolean;
  isDefault?: boolean;
  message: string | string[];
  evaluateResult?: EvaluateResult;
};

export type WarningStausOptions = {
  lockAfterUpdate?: boolean;
  override?: boolean;
};

export const useGenerateFormEditInitialValues = () => {
  const gpuDeviceList = useRef<any[]>([]);
  const workerList = useRef<any[]>([]);

  const generateCascaderOptions = (
    list: GPUListItem[],
    workerList: WorkerListItem[]
  ) => {
    // pick the worker fields from gpuList
    const workerFields = new Set(['worker_name', 'worker_id', 'worker_ip']);

    // generate a map for workerList by name to data
    const workerDataMap = new Map<string, WorkerListItem>();
    for (const worker of workerList) {
      workerDataMap.set(worker.name, worker);
    }

    const workersMap = new Map<string, GPUListItem[]>();
    for (const gpu of list) {
      if (!workersMap.has(gpu.worker_name)) {
        workersMap.set(gpu.worker_name, []);
      }
      workersMap.get(gpu.worker_name)!.push(gpu);
    }

    const gpuSelectorList = Array.from(workersMap.entries()).map(
      ([workerName, items]) => {
        const firstItem = items[0];
        const currentState = workerDataMap.get(workerName)?.state || '';
        const disDisabled = WorkerStatusMap.ready !== currentState;
        return {
          label: disDisabled
            ? `${workerName} [${WorkerStatusMapValue[currentState]}]`
            : workerName,
          value: workerName,
          parent: true,
          disabled: disDisabled,
          children: items
            .map((item) => ({
              label: item.name,
              value: item.id,
              index: item.index,
              ...Object.fromEntries(
                Object.entries(item).filter(([key]) => !workerFields.has(key))
              )
            }))
            .sort((a, b) => a.index - b.index),
          ...Object.fromEntries(
            Object.entries(firstItem).filter(([key]) => workerFields.has(key))
          )
        };
      }
    );

    return gpuSelectorList;
  };

  const getGPUList = async () => {
    const [gpuData, workerData] = await Promise.all([
      queryGPUList({ page: 1, perPage: 100 }),
      queryWorkersList({ page: 1, perPage: 100 })
    ]);
    const gpuList = generateCascaderOptions(gpuData.items, workerData.items);
    gpuDeviceList.current = gpuList;
    workerList.current = workerData.items;
    return gpuList;
  };

  const generateGPUSelector = (data: any, gpuOptions: any[]) => {
    const gpu_ids = _.get(data, 'gpu_selector.gpu_ids', []);
    if (gpu_ids.length === 0) {
      return [];
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

    return data.backend === backendOptionsMap.voxBox ? gpuids[0] : gpuids;
  };

  const generateFormValues = (data: ListItem, gpuOptions: any[]) => {
    const result = setSourceRepoConfigValue(data?.source || '', data);

    const formData = {
      ...result.values,
      categories: data?.categories?.length ? data.categories[0] : null,
      scheduleType: data?.gpu_selector ? 'manual' : 'auto',
      gpu_selector: data?.gpu_selector?.gpu_ids?.length
        ? {
            gpu_ids: generateGPUSelector(data, gpuOptions)
          }
        : null
    };
    return formData;
  };

  return {
    getGPUList,
    generateFormValues,
    gpuDeviceList,
    workerList
  };
};

export const useGenerateModelFileOptions = () => {
  const getModelFileList = async () => {
    try {
      const res = await queryModelFilesList({ page: 1, perPage: 100 });
      const list = res.items || [];
      return list;
    } catch (error) {
      console.error('Error fetching model file list:', error);
      return [];
    }
  };

  const generateModelFileOptions = (list: any[], workerList: any[]) => {
    const workerFields = new Set(['name', 'id', 'ip', 'status']);
    const workersMap = new Map<number, WorkerListItem>();

    for (const item of workerList) {
      if (!workersMap.has(item.id)) {
        workersMap.set(item.id, item);
      }
    }

    const result = Array.from(workersMap.values()).map((worker) => ({
      label: worker.name,
      value: worker.name,
      labels: worker.labels,
      parent: true,
      children: list
        .filter(
          (item) =>
            item.worker_id === worker.id && !!item.resolved_paths?.length
        )
        .map((item) => {
          const resolved_paths =
            Array.isArray(item.resolved_paths) && item.resolved_paths.length
              ? item.resolved_paths[0].split('/')
              : [];
          const label =
            resolved_paths.length > 0 ? resolved_paths.pop() : 'Unknown File';
          return {
            label: item.resolved_paths[0] || '',
            value: item.resolved_paths[0] || '',
            worker_labels: worker.labels,
            worker_name: worker.name,
            parent: false,
            ...item
          };
        }),
      ...Object.fromEntries(
        Object.entries(worker).filter(([key]) => workerFields.has(key))
      )
    }));

    const childrenList = result.reduce((acc: any[], cur) => {
      if (cur.children) {
        const list = cur.children.map((child: any) => ({
          ...child,
          label: `${cur.label}${child.label}`,
          value: child.value
        }));
        acc.push(...list);
      }
      return acc;
    }, []);

    return childrenList;
  };

  return {
    getModelFileList,
    generateModelFileOptions
  };
};

// handle for ascend npu only
export const checkOnlyAscendNPU = (gpuOptions: any[]) => {
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

export const checkCurrentbackend = (data: {
  isAudio: boolean;
  isGGUF: boolean;
  gpuOptions: any[];
  defaultBackend?: string;
}) => {
  const { isAudio, isGGUF, gpuOptions, defaultBackend } = data;
  if (isAudio) {
    return backendOptionsMap.voxBox;
  }

  if (isGGUF) {
    return backendOptionsMap.llamaBox;
  }

  if (checkOnlyAscendNPU(gpuOptions)) {
    return backendOptionsMap.ascendMindie;
  }
  return defaultBackend;
};

export const useCheckCompatibility = () => {
  const intl = useIntl();
  const cacheFormValuesRef = useRef<any>({});
  const checkTokenRef = useRef<any>(null);
  const submitAnyway = useRef<boolean>(false);
  const requestIdRef = useRef(0);
  const updateStatusTimer = useRef<any>(null);
  const isLockWarningStatus = useRef<boolean>(false);
  const [warningStatus, setWarningStatus] = useState<MessageStatus>({
    show: false,
    title: '',
    message: []
  });

  const updateRequestId = () => {
    requestIdRef.current += 1;
    return requestIdRef.current;
  };

  const lockWarningStatus = () => {
    isLockWarningStatus.current = true;
  };

  const unlockWarningStatus = () => {
    isLockWarningStatus.current = false;
  };

  const updateWarningStatus = (
    params: MessageStatus,
    options?: WarningStausOptions
  ) => {
    const { lockAfterUpdate = false, override = false } = options || {};
    console.log('updateWarningStatus', params, options);

    setWarningStatus((prev: MessageStatus) => {
      if (isLockWarningStatus.current && !override) {
        return prev;
      }

      if (lockAfterUpdate) {
        lockWarningStatus();
      }

      return params;
    });
  };

  const handleEvaluate = async (data: any) => {
    try {
      checkTokenRef.current?.cancel();
      checkTokenRef.current = createAxiosToken();
      setWarningStatus({
        show: true,
        title: '',
        type: 'transition',
        message: intl.formatMessage({ id: 'models.form.evaluating' })
      });
      const evalution = await evaluationsModelSpec(
        {
          model_specs: [
            {
              ..._.omit(data, ['scheduleType']),
              categories: Array.isArray(data.categories)
                ? data.categories
                : data.categories
                  ? [data.categories]
                  : []
            }
          ]
        },
        {
          token: checkTokenRef.current.token
        }
      );
      return evalution.results?.[0];
    } catch (error) {
      return null;
    }
  };

  const handleCheckCompatibility = (
    evaluateResult: EvaluateResult | null
  ): MessageStatus => {
    console.log('handleCheckCompatibility', evaluateResult);
    if (!evaluateResult) {
      return {
        show: false,
        message: ''
      };
    }
    const {
      compatible,
      compatibility_messages = [],
      scheduling_messages = [],
      resource_claim,
      error,
      error_message
    } = evaluateResult || {};

    // error message
    if (error) {
      return {
        show: true,
        type: 'danger',
        message: `${intl.formatMessage({ id: 'models.search.evaluate.error' })}${error_message}`
      };
    }

    const hasClaim = !!resource_claim?.ram || !!resource_claim?.vram;

    let msgData = {
      title:
        scheduling_messages?.length > 0
          ? compatibility_messages?.join(' ')
          : '',
      message:
        scheduling_messages?.length > 0
          ? scheduling_messages
          : compatibility_messages?.join(' ')
    };
    if (hasClaim) {
      const ram = convertFileSize(resource_claim.ram, 2);
      const vram = convertFileSize(resource_claim.vram, 2);
      let messageId = 'models.form.check.claims';
      if (!ram) {
        messageId = 'models.form.check.claims2';
      }
      if (!vram) {
        messageId = 'models.form.check.claims3';
      }
      msgData = {
        title: intl.formatMessage({ id: 'models.form.check.passed' }),
        message: intl.formatMessage({ id: messageId }, { ram, vram })
      };
    }

    return {
      show: !compatible || hasClaim,
      type: !compatible ? 'warning' : 'success',
      ...msgData
    };
  };

  const handleShowCompatibleAlert = (
    evaluateResult: EvaluateResult | null,
    options?: WarningStausOptions
  ) => {
    const result = handleCheckCompatibility(evaluateResult);
    if (updateStatusTimer.current) {
      clearTimeout(updateStatusTimer.current);
    }
    updateStatusTimer.current = setTimeout(() => {
      updateWarningStatus(result, options);
    }, 300);
  };

  const updateShowWarning = (params: {
    backend: string;
    localPath: string;
    source: string;
  }) => {
    const { backend, localPath, source } = params;
    if (source !== modelSourceMap.local_path_value || !localPath) {
      return {
        show: false,
        message: ''
      };
    }

    const isBlobFile = localPath?.split('/').pop()?.includes('sha256');
    const isOllamaModel = localPath?.includes('ollama');
    const isGGUFFile = localPath.endsWith('.gguf');

    const isOllamaModelFile = isBlobFile || isOllamaModel;

    let warningMessage = '';
    if (isOllamaModelFile && backend === backendOptionsMap.llamaBox) {
      warningMessage = '';
    } else if (isOllamaModelFile && backend !== backendOptionsMap.llamaBox) {
      warningMessage = intl.formatMessage({
        id: 'models.form.ollama.warning'
      });
    } else if (isGGUFFile && backend !== backendOptionsMap.llamaBox) {
      warningMessage = intl.formatMessage({
        id: 'models.form.backend.warning'
      });
    } else if (!isGGUFFile && backend === backendOptionsMap.llamaBox) {
      warningMessage = intl.formatMessage({
        id: 'models.form.backend.warning.llamabox'
      });
    }

    return {
      show: !!warningMessage,
      isHtml: true,
      message: warningMessage
    };
  };

  const handleUpdateWarning = (params: {
    backend: string;
    localPath: string;
    source: string;
  }) => {
    const warningMessage = updateShowWarning(params);
    return warningMessage;
  };

  const generateGPUIds = (data: FormData) => {
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
        gpu_ids: result || []
      }
    };
  };

  const handleDoEvalute = async (formData: FormData) => {
    const currentRequestId = updateRequestId();
    const evalutionData = await handleEvaluate(formData);
    if (currentRequestId === requestIdRef.current) {
      handleShowCompatibleAlert?.(evalutionData);
      return evalutionData;
    }
    return null;
  };

  const checkRequiredValue = (allValues: any) => {
    const { scheduleType } = allValues;
    const gpuIds = allValues.gpu_selector?.gpu_ids || [];

    const noLocalValue =
      allValues.source === modelSourceMap.local_path_value &&
      !allValues.local_path;

    const noOllamaValue =
      allValues.source === modelSourceMap.ollama_library_value &&
      !allValues.ollama_library_model_name;

    if (scheduleType === 'manual') {
      return !gpuIds.length || noLocalValue || noOllamaValue;
    }

    return noLocalValue || noOllamaValue;
  };

  const clearCahceFormValues = () => {
    cacheFormValuesRef.current = {};
  };

  const handleOnValuesChange = async (params: {
    changedValues: any;
    allValues: any;
    source: string;
  }) => {
    const { allValues, source } = params;
    if (_.isEqual(cacheFormValuesRef.current, allValues)) {
      console.log('No changes detected, skipping evaluation.');
      return;
    }

    cacheFormValuesRef.current = allValues;
    const data = getSourceRepoConfigValue(source, allValues);
    const gpuSelector = generateGPUIds(data.values);
    return await handleDoEvalute({
      ...data.values,
      ...gpuSelector,
      replicas: allValues.replicas || 0
    });
  };

  // trigger from local_path change or backend change
  const handleBackendChangeBefore = (params: {
    local_path: string;
    backend: string;
    source: string;
  }) => {
    const { local_path, backend, source } = params;

    const res = handleUpdateWarning?.({
      backend,
      localPath: local_path,
      source: source
    });

    setWarningStatus?.(res);
    return res;
  };

  const { run: debounceHandleValuesChange } = useDebounceFn(
    handleOnValuesChange,
    { wait: 500 }
  );

  const cancelEvaluate = () => {
    // update the requestId to cancel the current evaluation
    updateRequestId();
    checkTokenRef.current?.cancel();
    checkTokenRef.current = null;
  };

  useEffect(() => {
    return () => {
      cancelEvaluate();
      clearCahceFormValues();
    };
  }, []);

  return {
    handleShowCompatibleAlert,
    handleUpdateWarning,
    handleDoEvalute,
    generateGPUIds,
    handleEvaluate,
    setWarningStatus: updateWarningStatus,
    unlockWarningStatus,
    cancelEvaluate,
    handleBackendChangeBefore,
    handleOnValuesChange: handleOnValuesChange,
    handleEvaluateOnChange: handleOnValuesChange,
    clearCahceFormValues,
    warningStatus,
    checkTokenRef,
    submitAnyway
  };
};

export const useSelectModel = (data: { gpuOptions: any[] }) => {
  // just for setting the model name or repo_id, and the backend, Since the model type is fixed.
  const { gpuOptions } = data;

  const onSelectModel = (selectModel: any, source: string) => {
    let name = _.split(selectModel.name, '/').slice(-1)[0];
    const reg = /(-gguf)$/i;
    name = _.toLower(name).replace(reg, '');

    const modelTaskData = handleRecognizeAudioModel(selectModel, source);

    const backend = checkCurrentbackend({
      defaultBackend: backendOptionsMap.vllm,
      isAudio: modelTaskData.type === modelTaskMap.audio,
      isGGUF: selectModel.isGGUF,
      gpuOptions: gpuOptions
    });

    return {
      repo_id: selectModel.name,
      file_name: '',
      name: name,
      source: source,
      backend: backend
    };
  };

  return {
    onSelectModel
  };
};
