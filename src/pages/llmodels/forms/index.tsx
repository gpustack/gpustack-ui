import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import CollapsePanel from '@/pages/_components/collapse-panel';
import { useIntl } from '@umijs/max';
import { Form, Segmented } from 'antd';
import _ from 'lodash';
import React, { forwardRef, useImperativeHandle, useMemo } from 'react';
import styled from 'styled-components';
import {
  deployFormKeyMap,
  excludeFields,
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
import useFieldScroll from '../hooks/use-field-scroll';
import { useGenerateGPUOptions } from '../hooks/use-form-initial-values';
import useQueryBackends from '../hooks/use-query-backends';
import AdvanceConfig from './advance-config';
import BasicForm from './basic';
import Performance from './performance';
import ScheduleTypeForm from './schedule-type';

const advancedRequiredFields = [
  'gpu_selector',
  'backend',
  'image_name',
  'run_command'
];
const performanceRequiredFields = ['speculative_config'];

const SegmentedInner = styled(Segmented)`
  width: 100%;
  border-radius: 0;
  .ant-segmented-item {
    flex: 1;
  }
`;

const SegmentedHeader = styled.div<{ $top?: number }>`
  position: sticky;
  top: ${(props) => props.$top || 0}px;
  z-index: 10;
  padding-bottom: 16px;
  background-color: var(--ant-color-bg-elevated);
`;

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
  fields?: string[];
  clearCacheFormValues?: () => void;
  onValuesChange?: (changedValues: any, allValues: any) => void;
  onSourceChange?: (value: string) => void;
  onOk: (values: FormData) => void;
  onBackendChange?: (value: string) => void;
}

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
    onOk
  } = props;
  const { backendOptions, getBackendOptions } = useQueryBackends();
  const { getGPUOptionList, gpuOptions, workerLabelOptions } =
    useGenerateGPUOptions();
  const [form] = Form.useForm();
  const intl = useIntl();
  const [activeKey, setActiveKey] = React.useState<string[]>([]);
  const scheduleType = Form.useWatch('scheduleType', form);
  const [target, setTarget] = React.useState<string>('basic');

  const segmentOptions = [
    {
      value: 'basic',
      label: intl.formatMessage({ id: 'common.title.basicInfo' }),
      field: 'name'
    },
    {
      value: 'scheduling',
      label: intl.formatMessage({ id: 'models.form.scheduling' }),
      field: 'scheduleType'
    },
    {
      value: 'performance',
      label: intl.formatMessage({ id: 'models.form.performance' }),
      field: 'extended_kv_cache.enabled'
    },
    {
      value: 'advanced',
      label: intl.formatMessage({ id: 'resources.form.advanced' }),
      field: 'categories'
    }
  ];

  const { scrollToSegment } = useFieldScroll({
    form,
    activeKey,
    setActiveKey,
    segmentOptions
  });

  const SegmentedTop = useMemo(() => {
    if (
      modelSourceMap.local_path_value === source ||
      action === PageAction.EDIT ||
      formKey === deployFormKeyMap.catalog
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
          gpus_per_replica: -1
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
      !option.isBuiltIn &&
      [backendOptionsMap.SGLang, backendOptionsMap.vllm].includes(backend)
    ) {
      return {
        extended_kv_cache: {
          enabled: false
        }
      };
    }
    return {};
  };

  const handleBackendChange = async (val: string, option: BackendOption) => {
    form.setFieldsValue({
      env: null,
      backend_version: option.default_version || '',
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

  const handleClusterChange = (value: number) => {
    getGPUOptionList({ clusterId: value });
    getBackendOptions({ cluster_id: value });
    if (scheduleType === ScheduleValueMap.Manual) {
      form.setFieldValue(['gpu_selector', 'gpu_ids'], []);
    }
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

  const handleOnValuesChange = async (changedValues: any, allValues: any) => {
    const fieldName = getFieldPaths(changedValues);

    if (excludeFields.includes(fieldName)) {
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

      if (isPerformanceRequired) {
        collapseKeys.push('performance');
      }

      if (isAdvancedRequired) {
        collapseKeys.push('advanced');
      }

      setActiveKey((prev: string[]) => [
        ...new Set([...prev, ...collapseKeys])
      ]);
    }
  };

  const handleTargetChange = async (val: any) => {
    setTarget(val);

    await scrollToSegment(val, { offsetTop: SegmentedTop.offsetTop });
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
        clearCacheFormValues: clearCacheFormValues,
        onValuesChange: onValuesChange,
        onBackendChange: handleBackendChange
      }}
    >
      <SegmentedHeader $top={SegmentedTop.top}>
        <SegmentedInner
          defaultValue="basic"
          value={target}
          onChange={handleTargetChange}
          options={segmentOptions}
        />
      </SegmentedHeader>
      <Form
        name="deployModel"
        form={form}
        onFinish={handleOk}
        preserve={true}
        clearOnDestroy={true}
        onValuesChange={handleOnValuesChange}
        onFinishFailed={handleOnFinishFailed}
        scrollToFirstError={true}
        initialValues={{
          replicas: 1,
          source: props.source,
          placement_strategy: 'spread',
          cpu_offloading: true,
          scheduleType: ScheduleValueMap.Auto,
          categories: null,
          restart_on_error: true,
          distributed_inference_across_workers: true,
          extended_kv_cache: {
            enabled: false,
            chunk_size: 256,
            max_local_cpu_size: 10,
            remote_url: ''
          },
          ...initialValues
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
              key: 'scheduling',
              label: intl.formatMessage({ id: 'models.form.scheduling' }),
              forceRender: true,
              children: <ScheduleTypeForm></ScheduleTypeForm>
            },
            {
              key: 'performance',
              label: intl.formatMessage({ id: 'models.form.performance' }),
              forceRender: true,
              children: <Performance></Performance>
            },
            {
              key: 'advanced',
              label: intl.formatMessage({ id: 'resources.form.advanced' }),
              forceRender: true,
              children: <AdvanceConfig></AdvanceConfig>
            }
          ]}
        ></CollapsePanel>
      </Form>
    </FormContext.Provider>
  );
});

export default DataForm;
