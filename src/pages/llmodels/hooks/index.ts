import { clusterListAtom, workerListAtom } from '@/atoms/models';
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
import {
  backendOptionsMap,
  BuiltInBackendOptions
} from '../config/backend-parameters';
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
      const res = await queryModelFilesList({ page: -1 });
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
  const workerList = useAtomValue(workerListAtom);
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
      // when no cluster selected, show warning and prompt user to add cluster first
      console.log('handleEvaluate', data);

      if (!data.cluster_id || workerList.length === 0) {
        setWarningStatus({
          show: true,
          title: '',
          type: 'warning',
          message: !data.cluster_id
            ? intl.formatMessage({ id: 'noresult.resources.cluster' })
            : intl.formatMessage({ id: 'noresult.resources.worker' })
        });
        return;
      }
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
          cluster_id: data.cluster_id,
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

    // current cluster resource claim: {ram: number, vram: number}
    const resource_claim = resourceClaimMap.get(`${cluster_id}`);

    const hasClaim = resourceClaimMap.has(`${cluster_id}`);

    let compatibilityMessage = compatibility_messages.join(' ');

    compatibilityMessage = compatibilityMessage.startsWith(
      `The model file path you specified does not exist on the GPUStack server. It's recommended`
    )
      ? intl.formatMessage({ id: 'models.form.modelfile.notfound' })
      : compatibilityMessage;

    let msgData = {
      title: scheduling_messages?.length > 0 ? compatibilityMessage : '',
      message:
        scheduling_messages?.length > 0
          ? scheduling_messages
          : compatibilityMessage
    };

    let noResourceClaim = false;

    if (hasClaim) {
      const ram = convertFileSize(resource_claim?.ram || 0, 2);
      const vram = convertFileSize(resource_claim?.vram || 0, 2);
      let messageId = 'models.form.check.claims';
      // when no ram and no vram
      noResourceClaim = !ram && !vram;

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
      show: noResourceClaim ? false : !compatible || hasClaim,
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

  const checkIsGGUFFileOrNotSupport = (localPath: string, allValues?: any) => {
    const isBlobFile = localPath?.split('/').pop()?.includes('sha256');
    const isOllamaModel = localPath?.includes('ollama');
    const isGGUFFile = localPath?.endsWith?.('.gguf');

    const isOllamaModelFile = isBlobFile || isOllamaModel;
    return (
      isGGUFFile ||
      isOllamaModelFile ||
      allValues?.huggingface_filename?.endsWith?.('.gguf') ||
      allValues?.model_scope_file_path?.endsWith?.('.gguf')
    );
  };

  const clearCacheFormValues = () => {
    cacheFormValuesRef.current = {};
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

    const isGGUFFile = checkIsGGUFFileOrNotSupport(localPath);

    let warningMessage = '';
    if (isGGUFFile && BuiltInBackendOptions.includes(backend)) {
      warningMessage = intl.formatMessage({
        id: 'models.form.backend.warning'
      });
    } else if (isGGUFFile && !BuiltInBackendOptions.includes(backend)) {
      warningMessage = '';
    }
    clearCacheFormValues();
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
    if (currentRequestId === requestIdRef.current && evalutionData) {
      handleShowCompatibleAlert?.(evalutionData);
      return evalutionData;
    }
    return null;
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
    if (
      _.isEqual(cacheFormValuesRef.current, allValues) ||
      noLocalPathValue(allValues) ||
      !allValues.replicas
    ) {
      console.log('No changes detected, skipping evaluation.');
      return;
    }

    // when custom backend, and no run_command or image_name, skip evaluate
    if (
      backendOptionsMap.custom === allValues.backend &&
      (!allValues.run_command || !allValues.image_name)
    ) {
      setWarningStatus({
        show: false,
        type: 'warning',
        isHtml: true,
        message: ''
      });
      return;
    }

    // check gguf: for online and local path
    if (
      checkIsGGUFFileOrNotSupport(allValues.local_path, allValues) &&
      BuiltInBackendOptions.includes(allValues.backend)
    ) {
      clearCacheFormValues();
      setWarningStatus({
        show: true,
        type: 'warning',
        isHtml: true,
        message: intl.formatMessage({
          id: 'models.form.backend.warning'
        })
      });

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

  const onSelectModel = (
    selectModel: any,
    options: {
      source: string;
      defaultBackend?: string;
      flatBackendOptions?: any[];
    }
  ) => {
    console.log('options==========', options);
    const { source, defaultBackend, flatBackendOptions } = options;
    let name = _.split(selectModel.name, '/').slice(-1)[0];
    const reg = /(-gguf)$/i;
    name = _.toLower(name).replace(reg, '');

    const modelTaskData = recognizeAudioModel(selectModel, source);

    const backend = checkCurrentbackend({
      defaultBackend: defaultBackend || backendOptionsMap.vllm,
      isAudio: modelTaskData.type === modelTaskMap.audio,
      isGGUF: selectModel.isGGUF,
      gpuOptions: gpuOptions
    });

    const selectedBackend = flatBackendOptions?.find(
      (item) => item.value === backend
    );

    return {
      ...(source === modelSourceMap.huggingface_value
        ? { huggingface_repo_id: selectModel.name }
        : {}),
      ...(source === modelSourceMap.modelscope_value
        ? { model_scope_model_id: selectModel.name }
        : {}),
      ...modelTaskData,
      env: {
        ...(selectedBackend?.default_env || {})
      },
      name: name,
      source: source,
      backend: backend
    };
  };

  return {
    onSelectModel
  };
};
