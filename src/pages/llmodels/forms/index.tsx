import IconFont from '@/components/icon-font';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import CollapsePanel from '@/pages/_components/collapse-panel';
import { useWrapperContext } from '@/pages/_components/column-wrapper/use-wrapper-context';
import ScrollSpyTabs from '@/pages/_components/scroll-spy-tabs';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo
} from 'react';
import {
  DeployFormKeyMap,
  DO_NOT_NOTIFY_RECREATE,
  DO_NOT_TRIGGER_CHECK_COMPATIBILITY,
  modelSourceMap,
  ScheduleValueMap
} from '../config';
import { backendOptionsMap } from '../config/backend-parameters';
import { FormContext } from '../config/form-context';
import {
  BackendOption,
  DeployFormKey,
  FormData,
  SourceType
} from '../config/types';
import { generateGPUIds } from '../config/utils';
import { useGenerateGPUOptions } from '../hooks/use-form-initial-values';
import useQueryBackends from '../hooks/use-query-backends';
import { useQueryContextLength } from '../services/use-query-context-length';
import AdvanceConfig from './advance-config';
import BasicForm from './basic';
import Performance from './performance';
import ScheduleTypeForm from './schedule-type';

const baseRequiredFields = ['name', 'source'];

const advancedRequiredFields = ['backend', 'image_name', 'run_command'];

const scheduleRequiredFields = ['gpu_selector'];

const performanceRequiredFields = ['speculative_config'];

interface DataFormProps {
  initialValues?: FormData;
  ref?: any;
  source: SourceType;
  action: PageActionType;
  isGGUF: boolean;
  formKey: DeployFormKey;
  sourceDisable?: boolean;
  sourceList?: Global.BaseOption<string>[];
  clusterList: Global.BaseOption<number>[];
  fields?: string[]; // control some fields to show in the form
  clearCacheFormValues?: () => void;
  onValuesChange?: (changedValues: any, allValues: any) => void;
  onSourceChange?: (value: string) => void;
  onOk: (values: FormData) => void;
  onBackendChange?: (value: string) => void;
  onClusterChange?: (value: number) => void;
}

const TABKeysMap = {
  BASIC: 'basic',
  SCHEDULING: 'scheduling',
  PERFORMANCE: 'performance',
  ADVANCED: 'advanced'
};

const DataForm: React.FC<DataFormProps> = forwardRef((props, ref) => {
  const {
    action,
    isGGUF,
    formKey,
    source,
    initialValues,
    sourceDisable = true,
    sourceList,
    clusterList = [],
    fields = ['source'],
    clearCacheFormValues,
    onBackendChange,
    onSourceChange,
    onValuesChange,
    onClusterChange,
    onOk
  } = props;
  const { getScrollElementScrollableHeight } = useWrapperContext();
  const { backendOptions, getBackendOptions } = useQueryBackends();
  const { getGPUOptionList, gpuOptions, workerLabelOptions } =
    useGenerateGPUOptions();
  const [form] = Form.useForm();
  const intl = useIntl();
  const [activeKey, setActiveKey] = React.useState<string[]>([]);
  const { modelContextData, fetchContextLength } = useQueryContextLength();
  const localPath = Form.useWatch('local_path', form);
  const modelScopeModelId = Form.useWatch('model_scope_model_id', form);
  const huggingfaceRepoId = Form.useWatch('huggingface_repo_id', form);
  const scrollTabsRef = React.useRef<any>(null);

  const segmentOptions = [
    {
      value: TABKeysMap.BASIC,
      label: intl.formatMessage({ id: 'common.title.basicInfo' }),
      icon: <IconFont type="icon-basic" />,
      field: 'name'
    },
    {
      value: TABKeysMap.PERFORMANCE,
      label: intl.formatMessage({ id: 'models.form.performance' }),
      icon: <IconFont type="icon-speed" />,
      field: 'extended_kv_cache.enabled'
    },
    {
      value: TABKeysMap.SCHEDULING,
      label: intl.formatMessage({ id: 'models.form.scheduling' }),
      icon: <IconFont type="icon-model" />,
      field: 'scheduleType'
    },
    {
      value: TABKeysMap.ADVANCED,
      label: intl.formatMessage({ id: 'resources.form.advanced' }),
      icon: <IconFont type="icon-settings" />,
      field: 'categories'
    }
  ];

  const segmentedTop = useMemo(() => {
    if (
      modelSourceMap.local_path_value === source ||
      action === PageAction.EDIT ||
      formKey === DeployFormKeyMap.CATALOG
    ) {
      return {
        top: 0,
        offsetTop: 96
      };
    }

    return {
      top: 50,
      offsetTop: 146
    };
  }, [source, formKey, action]);

  const handleSumit = () => {
    form.submit();
  };

  // voxbox is not support multi gpu
  const updateGPUSelector = (backend: string) => {
    const gpuids = form.getFieldValue(['gpu_selector', 'gpu_ids']) || [];

    if (backend === backendOptionsMap.voxBox && gpuids.length > 0) {
      return {
        gpu_selector: {
          gpu_ids: [gpuids[0]],
          gpus_per_replica: null
        }
      };
    }
    return {
      gpu_selector: { gpu_ids: gpuids }
    };
  };

  const checkIsGGUF = () => {
    const huggingface_filename = form.getFieldValue('huggingface_filename');
    const model_scope_model_id = form.getFieldValue('model_scope_model_id');
    const local_path = form.getFieldValue('local_path');

    if (local_path) {
      const isEndwithGGUF = _.endsWith(local_path, '.gguf');
      const isBlobFile = local_path.split('/').pop().includes('sha256');
      return isEndwithGGUF || isBlobFile;
    }
    return huggingface_filename || model_scope_model_id;
  };

  const updateFieldsOnGGUF = () => {
    // when isGGUF is true, set distributed_inference_across_workers and cpu_offloading to true
    return {
      distributed_inference_across_workers: true,
      cpu_offloading: true
    };
  };

  const updateKVCacheConfig = (backend: string, option: BackendOption) => {
    if (
      !option.isBuiltIn ||
      ![backendOptionsMap.SGLang, backendOptionsMap.vllm].includes(backend)
    ) {
      return {
        extended_kv_cache: {
          enabled: false
        },
        speculative_config: {
          enabled: false
        }
      };
    }
    return {};
  };

  const handleBackendChange = async (val: string, option: BackendOption) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    form.setFieldsValue({
      env: null,
      backend_version: null, // don't set default version here, let the user select it
      backend_parameters: option.default_backend_param || [],
      ...updateKVCacheConfig(val, option),
      ...updateGPUSelector(val)
    });

    onBackendChange?.(val);
  };

  // generate the data is available for the backend including the gpu_ids
  const handleOk = async (formdata: FormData) => {
    let data = _.cloneDeep(formdata);
    data.categories = data.categories ? [data.categories] : [];
    const gpuSelector = generateGPUIds(data);
    const allValues = {
      ..._.omit(data, ['scheduleType']),
      ...gpuSelector
    };
    onOk(allValues);
  };

  const handleClusterChange = async (value: number) => {
    await onClusterChange?.(value);
    getGPUOptionList({ clusterId: value });
    getBackendOptions({ cluster_id: value });
    form.setFieldsValue({
      scheduleType: ScheduleValueMap.Auto,
      gpu_selector: null
    });
    await new Promise((resolve) => {
      setTimeout(resolve, 150);
    });
    onValuesChange?.({}, form.getFieldsValue());
  };

  const getFieldPaths = (obj: Record<string, any>, prefix = ''): string => {
    const result = Object.entries(obj).flatMap(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
        ? getFieldPaths(value, path)
        : [path];
    });

    return result[0] || '';
  };

  /**
   * auto check compatibility or notify recreate when certain fields change
   * @param changedValues
   * @param allValues
   * @returns
   */
  const handleOnValuesChange = async (changedValues: any, allValues: any) => {
    const fieldName = getFieldPaths(changedValues);

    if (
      DO_NOT_TRIGGER_CHECK_COMPATIBILITY.includes(fieldName) ||
      (DO_NOT_NOTIFY_RECREATE.includes(fieldName) && action === PageAction.EDIT)
    ) {
      return;
    }
    onValuesChange?.(changedValues, allValues);
  };

  const handleOnCollapseChange = (keys: string | string[]) => {
    setActiveKey(Array.isArray(keys) ? keys : [keys]);
  };

  const handleOnFinishFailed = (errorInfo: any) => {
    const { errorFields } = errorInfo;
    if (errorFields && errorFields.length > 0) {
      const collapseKeys: string[] = [];
      const names = errorFields.map((item: any) => item.name[0]);
      const isAdvancedRequired = names.some((name: string) =>
        advancedRequiredFields.includes(name)
      );

      const isPerformanceRequired = names.some((name: string) =>
        performanceRequiredFields.includes(name)
      );

      const isScheduleRequired = names.some((name: string) =>
        scheduleRequiredFields.includes(name)
      );

      const isBaseRequired = names.some((name: string) =>
        baseRequiredFields.includes(name)
      );

      if (isScheduleRequired) {
        collapseKeys.push(TABKeysMap.SCHEDULING);
      }

      if (isPerformanceRequired) {
        collapseKeys.push(TABKeysMap.PERFORMANCE);
      }

      if (isAdvancedRequired) {
        collapseKeys.push(TABKeysMap.ADVANCED);
      }

      if (isBaseRequired) {
        scrollTabsRef.current?.handleTargetChange(TABKeysMap.BASIC);
      } else if (isScheduleRequired) {
        scrollTabsRef.current?.handleTargetChange(TABKeysMap.SCHEDULING);
      } else if (isPerformanceRequired) {
        scrollTabsRef.current?.handleTargetChange(TABKeysMap.PERFORMANCE);
      } else if (isAdvancedRequired && formKey === DeployFormKeyMap.CATALOG) {
        scrollTabsRef.current?.handleTargetChange(TABKeysMap.ADVANCED);
      } else if (
        isAdvancedRequired &&
        formKey === DeployFormKeyMap.DEPLOYMENT
      ) {
        scrollTabsRef.current?.handleTargetChange(TABKeysMap.BASIC);
      }

      setActiveKey((prev: string[]) => [
        ...new Set([...prev, ...collapseKeys])
      ]);
    }
  };

  useImperativeHandle(ref, () => {
    return {
      form: form,
      submit: handleSumit,
      resetFields: (fields: any[]) => {
        form.resetFields(fields);
      },
      setFieldsValue: (values: FormData) => {
        form.setFieldsValue(values);
      },
      setFieldValue: (name: string, value: any) => {
        form.setFieldValue(name, value);
      },
      getFieldValue: (name: string) => {
        return form.getFieldValue(name);
      },
      getFieldsValue: () => {
        return form.getFieldsValue();
      },
      getGPUOptionList: async (params: { clusterId: number }) => {
        return await getGPUOptionList(params);
      },
      getBackendOptions: async (params?: { cluster_id: number }) => {
        return await getBackendOptions(params);
      }
    };
  });

  useEffect(() => {
    if (isGGUF || (!localPath && !modelScopeModelId && !huggingfaceRepoId)) {
      return;
    }
    let params = {};
    if (source === modelSourceMap.local_path_value) {
      params = { local_path: localPath };
    } else if (source === modelSourceMap.modelscope_value) {
      params = { model_scope_model_id: modelScopeModelId };
    } else if (source === modelSourceMap.huggingface_value) {
      params = { huggingface_repo_id: huggingfaceRepoId };
    }

    // TODO
    // fetchContextLength({ ...params, source });
  }, [isGGUF, source, localPath, modelScopeModelId, huggingfaceRepoId]);

  const handleActiveChange = (key: string[]) => {
    setActiveKey(key);
  };

  return (
    <FormContext.Provider
      value={{
        isGGUF: isGGUF,
        formKey: formKey,
        source: props.source,
        action: action,
        gpuOptions: gpuOptions,
        backendOptions: backendOptions,
        workerLabelOptions: workerLabelOptions,
        initialValues: initialValues,
        modelContextData: modelContextData,
        clearCacheFormValues: clearCacheFormValues,
        onValuesChange: onValuesChange,
        onBackendChange: handleBackendChange
      }}
    >
      <ScrollSpyTabs
        ref={scrollTabsRef}
        defaultTarget="basic"
        segmentOptions={segmentOptions}
        activeKey={activeKey}
        setActiveKey={handleActiveChange}
        segmentedTop={segmentedTop}
        getScrollElementScrollableHeight={getScrollElementScrollableHeight}
      >
        <Form
          name="deployModel"
          form={form}
          onFinish={handleOk}
          preserve={false}
          clearOnDestroy={true}
          onValuesChange={handleOnValuesChange}
          onFinishFailed={handleOnFinishFailed}
          scrollToFirstError={true}
          initialValues={{
            replicas: 1,
            source: props.source,
            placement_strategy: 'spread',
            scheduleType: ScheduleValueMap.Auto,
            categories: null,
            restart_on_error: true,
            distributed_inference_across_workers: true,
            mode: 'throughput',
            generic_proxy: false,
            extended_kv_cache: {
              enabled: false,
              chunk_size: null,
              ram_ratio: 1.2,
              ram_size: null
            },
            speculative_config: {
              enabled: false,
              algorithm: '',
              draft_model: null,
              num_draft_tokens:
                initialValues?.speculative_config?.num_draft_tokens || 4,
              ngram_min_match_length:
                initialValues?.speculative_config?.ngram_min_match_length || 1,
              ngram_max_match_length:
                initialValues?.speculative_config?.ngram_max_match_length || 10
            },
            ...initialValues,
            backend_version: initialValues?.backend_version || null,
            max_context_len: initialValues?.max_context_len || 2048
          }}
        >
          <BasicForm
            fields={fields}
            sourceList={sourceList}
            clusterList={clusterList}
            sourceDisable={sourceDisable}
            handleClusterChange={handleClusterChange}
            onSourceChange={onSourceChange}
          ></BasicForm>
          <CollapsePanel
            activeKey={activeKey}
            accordion={false}
            onChange={handleOnCollapseChange}
            items={[
              {
                key: TABKeysMap.PERFORMANCE,
                label: intl.formatMessage({ id: 'models.form.performance' }),
                forceRender: true,
                children: <Performance></Performance>
              },
              {
                key: TABKeysMap.SCHEDULING,
                label: intl.formatMessage({ id: 'models.form.scheduling' }),
                forceRender: true,
                children: <ScheduleTypeForm></ScheduleTypeForm>
              },
              {
                key: TABKeysMap.ADVANCED,
                label: intl.formatMessage({ id: 'resources.form.advanced' }),
                forceRender: true,
                children: <AdvanceConfig></AdvanceConfig>
              }
            ]}
          ></CollapsePanel>
        </Form>
      </ScrollSpyTabs>
    </FormContext.Provider>
  );
});

export default DataForm;
