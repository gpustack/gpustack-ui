import { createAxiosToken } from '@/hooks/use-chunk-request';
import { queryModelFilesList, queryWorkersList } from '@/pages/resources/apis';
import { WorkerStatusMap } from '@/pages/resources/config';
import { ListItem as WorkerListItem } from '@/pages/resources/config/types';
import { convertFileSize } from '@/utils';
import { useIntl } from '@umijs/max';
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

type MessageStatus = {
  show: boolean;
  title?: string;
  type?: Global.MessageType;
  isHtml?: boolean;
  message: string | string[];
  evaluateResult?: EvaluateResult;
};

export const useGenerateFormEditInitialValues = () => {
  const gpuDeviceList = useRef<any[]>([]);
  const workerList = useRef<any[]>([]);

  const generateCascaderOptions = (
    list: GPUListItem[],
    workerList: WorkerListItem[]
  ) => {
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
        const disDisabled =
          WorkerStatusMap.ready !== workerDataMap.get(workerName)?.state;
        return {
          label: disDisabled
            ? `${workerName} [${workerDataMap.get(workerName)?.state}]`
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
    const gpuids: string[][] = [];

    gpuOptions?.forEach((item) => {
      item.children?.forEach((child: any) => {
        if (gpu_ids.includes(child.value)) {
          gpuids.push([item.value, child.value]);
        }
      });
    });

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
    // extract a list from the result, and the structure is like:
    // [
    //   {
    //     label: 'worker_name/child_label',
    //     value: 'child_value',
    //     ...other child properties
    //   }
    // ]
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
    console.log('childrenList', childrenList);

    return childrenList;

    // return result;
  };

  return {
    getModelFileList,
    generateModelFileOptions
  };
};

export const useCheckCompatibility = () => {
  const intl = useIntl();
  const cacheFormValuesRef = useRef<any>({});
  const checkTokenRef = useRef<any>(null);
  const submitAnyway = useRef<boolean>(false);
  const requestIdRef = useRef(0);
  const updateStatusTimer = useRef<any>(null);
  const [warningStatus, setWarningStatus] = useState<MessageStatus>({
    show: false,
    title: '',
    message: []
  });

  const updateRequestId = () => {
    requestIdRef.current += 1;
    return requestIdRef.current;
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
      resource_claim
    } = evaluateResult || {};

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
      msgData = {
        title: intl.formatMessage({ id: 'models.form.check.passed' }),
        message: ram
          ? intl.formatMessage(
              { id: 'models.form.check.claims' },
              { ram, vram }
            )
          : intl.formatMessage({ id: 'models.form.check.claims2' }, { vram })
      };
    }

    return {
      show: !compatible || hasClaim,
      type: !compatible ? 'warning' : 'success',
      ...msgData
    };
  };

  const handleShowCompatibleAlert = (evaluateResult: EvaluateResult | null) => {
    const result = handleCheckCompatibility(evaluateResult);
    if (updateStatusTimer.current) {
      clearTimeout(updateStatusTimer.current);
    }
    updateStatusTimer.current = setTimeout(() => {
      setWarningStatus(result);
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

    let warningMessage = '';
    if (isBlobFile && isOllamaModel && backend === backendOptionsMap.llamaBox) {
      warningMessage = '';
    } else if (
      isBlobFile &&
      isOllamaModel &&
      backend !== backendOptionsMap.llamaBox
    ) {
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
    }
    return evalutionData;
  };

  const checkRequiredValue = (allValues: any) => {
    const { scheduleType } = allValues;
    const gpuIds = allValues.gpu_selector?.gpu_ids || [];

    if (scheduleType === 'manual') {
      return !gpuIds.length;
    }

    const noLocalValue =
      allValues.source === modelSourceMap.local_path_value &&
      !allValues.local_path;

    const noOllamaValue =
      allValues.source === modelSourceMap.ollama_library_value &&
      !allValues.ollama_library_model_name;

    return noLocalValue || noOllamaValue;
  };

  const handleOnValuesChange = async (params: {
    changedValues: any;
    allValues: any;
    source: string;
  }) => {
    const { allValues, source } = params;
    if (_.isEqual(cacheFormValuesRef.current, allValues)) {
      return;
    }
    if (checkRequiredValue(allValues)) {
      setWarningStatus({
        show: false,
        title: '',
        message: ''
      });
      return;
    }
    cacheFormValuesRef.current = allValues;
    const data = getSourceRepoConfigValue(source, allValues);
    const gpuSelector = generateGPUIds(data.values);
    await handleDoEvalute({
      ...data.values,
      ...gpuSelector
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

    if (res.show) {
      setWarningStatus?.(res);
    }
    return res;
  };

  const debounceHandleValuesChange = _.debounce(handleOnValuesChange, 500);

  const cancelEvaluate = () => {
    checkTokenRef.current?.cancel();
    checkTokenRef.current = null;
    cacheFormValuesRef.current = {};
  };

  useEffect(() => {
    return () => {
      cancelEvaluate();
    };
  }, []);

  return {
    handleShowCompatibleAlert,
    handleUpdateWarning,
    handleDoEvalute,
    generateGPUIds,
    handleEvaluate,
    setWarningStatus,
    cancelEvaluate,
    handleBackendChangeBefore,
    handleOnValuesChange: debounceHandleValuesChange,
    warningStatus,
    checkTokenRef,
    submitAnyway
  };
};

export const useSelectModel = () => {
  // just for setting the model name or repo_id, and the backend, Since the model type is fixed.
  const onSelectModel = (selectModel: any, source: string) => {
    let name = _.split(selectModel.name, '/').slice(-1)[0];
    const reg = /(-gguf)$/i;
    name = _.toLower(name).replace(reg, '');

    const modelTaskData = handleRecognizeAudioModel(selectModel, source);

    return {
      repo_id: selectModel.name,
      name: name,
      backend:
        modelTaskData.type === modelTaskMap.audio
          ? backendOptionsMap.voxBox
          : selectModel.isGGUF
            ? backendOptionsMap.llamaBox
            : backendOptionsMap.vllm
    };
  };

  return {
    onSelectModel
  };
};
