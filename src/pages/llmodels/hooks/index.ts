import { createAxiosToken } from '@/hooks/use-chunk-request';
import { queryModelFilesList } from '@/pages/resources/apis';
import { ListItem as WorkerListItem } from '@/pages/resources/config/types';
import { useIntl } from '@umijs/max';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { evaluationsModelSpec, queryGPUList } from '../apis';
import {
  backendOptionsMap,
  modelSourceMap,
  setSourceRepoConfigValue
} from '../config';
import { EvaluateResult, GPUListItem, ListItem } from '../config/types';

export const useGenerateFormEditInitialValues = () => {
  const gpuDeviceList = useRef<any[]>([]);

  const generateCascaderOptions = (list: GPUListItem[]) => {
    const workerFields = new Set(['worker_name', 'worker_id', 'worker_ip']);

    const workersMap = new Map<string, GPUListItem[]>();
    for (const item of list) {
      if (!workersMap.has(item.worker_name)) {
        workersMap.set(item.worker_name, []);
      }
      workersMap.get(item.worker_name)!.push(item);
    }

    const workerList = Array.from(workersMap.entries()).map(
      ([workerName, items]) => {
        const firstItem = items[0];

        return {
          label: workerName,
          value: workerName,
          parent: true,
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

    return workerList;
  };

  const getGPUList = async () => {
    const data = await queryGPUList();
    const gpuList = generateCascaderOptions(data.items);
    gpuDeviceList.current = gpuList;
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
    gpuDeviceList
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
        .filter((item) => item.worker_id === worker.id)
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

  const checkTokenRef = useRef<any>(null);
  const [warningStatus, setWarningStatus] = useState<{
    show: boolean;
    title?: string;
    message: string | string[];
  }>({
    show: false,
    title: '',
    message: []
  });

  const handleEvaluate = async (data: any) => {
    try {
      checkTokenRef.current?.cancel();
      checkTokenRef.current = createAxiosToken();
      setWarningStatus({
        show: true,
        title: '',
        message: 'Evaluating compatibility...'
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

  const handleCheckCompatibility = (evaluateResult: EvaluateResult | null) => {
    if (!evaluateResult) {
      return {
        show: false,
        message: ''
      };
    }
    const {
      compatible,
      compatibility_messages = [],
      scheduling_messages = []
    } = evaluateResult || {};

    return {
      show: !compatible,
      title:
        scheduling_messages?.length > 0
          ? compatibility_messages?.join(' ')
          : '',
      message:
        scheduling_messages?.length > 0
          ? scheduling_messages
          : compatibility_messages?.join(' ')
    };
  };

  const handleShowCompatibleAlert = (evaluateResult: EvaluateResult | null) => {
    const result = handleCheckCompatibility(evaluateResult);
    setWarningStatus(result);
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

  useEffect(() => {
    return () => {
      checkTokenRef.current?.cancel();
      checkTokenRef.current = null;
    };
  }, []);

  return {
    handleShowCompatibleAlert,
    handleUpdateWarning,
    warningStatus,
    checkTokenRef,
    handleEvaluate,
    setWarningStatus
  };
};
