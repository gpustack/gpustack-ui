import { clusterListAtom } from '@/atoms/models';
import { createAxiosToken } from '@/hooks/use-chunk-request';
import { queryModelFilesList } from '@/pages/resources/apis';
import { ListItem as WorkerListItem } from '@/pages/resources/config/types';
import { convertFileSize } from '@/utils';
import { useIntl } from '@umijs/max';
import { useAtomValue } from 'jotai';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { evaluationsModelSpec } from '../apis';
import { modelSourceMap, modelTaskMap } from '../config';
import { backendOptionsMap } from '../config/backend-parameters';
import { EvaluateResult, FormData } from '../config/types';
import { generateGPUIds } from '../config/utils';
import useCheckBackend from './use-check-backend';
import useRecognizeAudio from './use-recognize-audio';

export type MessageStatus = {
  show: boolean;
  title?: string;
  type?: Global.MessageType;
  isHtml?: boolean;
  isDefault?: boolean;
  message: string | string[];
  evaluateResult?: EvaluateResult;
};

export interface ModelFileOption {
  label: string;
  value: number;
  labels?: Record<string, string>;
  parent: boolean;
  repoId?: string;
  fileName?: string;
  [key: string]: any;
  children?: ModelFileOption[];
}

export type WarningStausOptions = {
  lockAfterUpdate?: boolean;
  override?: boolean;
};

export const useGenerateWorkersModelFileOptions = () => {
  const [modelFileOptions, setModelFileOptions] = useState<ModelFileOption[]>(
    []
  );

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

  const generateWorkersModelFileOptions = (list: any[], workerList: any[]) => {
    const workerFields = new Set(['name', 'id', 'ip', 'status']);
    const workersMap = new Map<number, WorkerListItem>();

    for (const item of workerList) {
      if (!workersMap.has(item.id)) {
        workersMap.set(item.id, item);
      }
    }

    const result = Array.from(workersMap.values()).map((worker) => ({
      label: worker.name,
      value: worker.id,
      labels: worker.labels,
      parent: true,
      children: list
        .filter(
          (item) =>
            item.worker_id === worker.id && !!item.resolved_paths?.length
        )
        .map((item) => {
          return {
            label: item.resolved_paths[0] || '',
            value: item.resolved_paths[0] || '',
            parent: false,
            repoId: item.huggingface_repo_id || item.model_scope_model_id || '',
            fileName:
              item.huggingface_filename ||
              item.model_scope_file_path ||
              item.local_path ||
              '',
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

    setModelFileOptions(result);

    return childrenList;
  };

  return {
    getModelFileList,
    modelFileOptions,
    generateWorkersModelFileOptions
  };
};

export const useCheckCompatibility = () => {
  const intl = useIntl();
  const cacheFormValuesRef = useRef<any>({});
  const checkTokenRef = useRef<any>(null);
  const submitAnyway = useRef<boolean>(false);
  const requestIdRef = useRef(0);
  const updateStatusTimer = useRef<any>(null);
  const isLockWarningStatus = useRef<boolean>(false);
  const clusterList = useAtomValue(clusterListAtom);
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

  const getAvailableClusters = (ids: string[]) => {
    const clusterNames: string[] = [];
    clusterList.forEach?.((item: { value: number; label: string }) => {
      if (ids.includes(item.value.toString())) {
        clusterNames.push(item.label);
      }
    });
    return clusterNames.join(', ');
  };

  const handleCheckCompatibility = (
    evaluateResult: EvaluateResult | null
  ): MessageStatus => {
    console.log('handleCheckCompatibility', clusterList, evaluateResult);
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
      resource_claim_by_cluster_id,
      cluster_id,
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

    const resourceClaimMap = new Map(
      Object.entries(resource_claim_by_cluster_id || {})
    );

    // current cluster resource claim
    const resource_claim = resourceClaimMap.get(`${cluster_id}`);

    const hasClaim = !!resource_claim?.ram || !!resource_claim?.vram;

    // current cluster is not available, but other clusters are available
    const othersAvailable = !hasClaim && resourceClaimMap.size > 0;

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
    } else if (othersAvailable) {
      msgData = {
        title: intl.formatMessage({
          id: 'models.form.check.clusterUnavailable'
        }),
        message: intl.formatMessage(
          {
            id: 'models.form.check.otherClustersAvailable'
          },
          {
            clusters: getAvailableClusters(Array.from(resourceClaimMap.keys()))
          }
        )
      };
    }

    return {
      show: !compatible || hasClaim || othersAvailable,
      type: !compatible || othersAvailable ? 'warning' : 'success',
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

  const handleDoEvalute = async (formData: FormData) => {
    const currentRequestId = updateRequestId();
    const evalutionData = await handleEvaluate(formData);
    if (currentRequestId === requestIdRef.current) {
      handleShowCompatibleAlert?.(evalutionData);
      return evalutionData;
    }
    return null;
  };

  const clearCacheFormValues = () => {
    cacheFormValuesRef.current = {};
  };

  const noLocalPathValue = (allValues: any) => {
    return (
      allValues.source === modelSourceMap.local_path_value &&
      !allValues.local_path
    );
  };

  const handleOnValuesChange = async (params: {
    changedValues: any;
    allValues: any;
    source: string;
  }) => {
    const { allValues, source } = params;
    console.log('handleOnValuesChange', allValues);
    if (
      _.isEqual(cacheFormValuesRef.current, allValues) ||
      noLocalPathValue(allValues) ||
      !allValues.replicas
    ) {
      console.log('No changes detected, skipping evaluation.');
      return;
    }

    cacheFormValuesRef.current = _.cloneDeep(allValues);
    const gpuSelector = generateGPUIds(allValues);
    return await handleDoEvalute({
      ...allValues,
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

  const cancelEvaluate = () => {
    // update the requestId to cancel the current evaluation
    updateRequestId();
    checkTokenRef.current?.cancel();
    checkTokenRef.current = null;
  };

  useEffect(() => {
    return () => {
      cancelEvaluate();
      clearCacheFormValues();
    };
  }, []);

  return {
    handleShowCompatibleAlert,
    handleUpdateWarning,
    handleDoEvalute,
    handleEvaluate,
    setWarningStatus: updateWarningStatus,
    unlockWarningStatus,
    cancelEvaluate,
    handleBackendChangeBefore,
    handleOnValuesChange: handleOnValuesChange,
    handleEvaluateOnChange: handleOnValuesChange,
    clearCacheFormValues,
    warningStatus,
    checkTokenRef,
    submitAnyway
  };
};

export const useSelectModel = (data: { gpuOptions: any[] }) => {
  const { checkCurrentbackend } = useCheckBackend();
  const { recognizeAudioModel } = useRecognizeAudio();

  // just for setting the model name or repo_id, and the backend, Since the model type is fixed.
  const { gpuOptions } = data;

  const onSelectModel = (selectModel: any, source: string) => {
    let name = _.split(selectModel.name, '/').slice(-1)[0];
    const reg = /(-gguf)$/i;
    name = _.toLower(name).replace(reg, '');

    const modelTaskData = recognizeAudioModel(selectModel, source);

    const backend = checkCurrentbackend({
      defaultBackend: backendOptionsMap.vllm,
      isAudio: modelTaskData.type === modelTaskMap.audio,
      isGGUF: selectModel.isGGUF,
      gpuOptions: gpuOptions
    });

    return {
      ...(source === modelSourceMap.huggingface_value
        ? { huggingface_repo_id: selectModel.name }
        : {}),
      ...(source === modelSourceMap.modelscope_value
        ? { model_scope_model_id: selectModel.name }
        : {}),
      ...modelTaskData,
      name: name,
      source: source,
      backend: backend
    };
  };

  return {
    onSelectModel
  };
};
