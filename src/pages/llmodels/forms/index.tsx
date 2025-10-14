import { PageActionType } from '@/config/types';
import CollapsePanel from '@/pages/_components/collapse-panel';
import { useWrapperContext } from '@/pages/_components/column-wrapper/use-wrapper-context';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import React, { forwardRef, useImperativeHandle } from 'react';
import { excludeFields, ScheduleValueMap } from '../config';
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
import AdvanceConfig from './advance-config';
import BasicForm from './basic';

interface DataFormProps {
  initialValues?: any;
  ref?: any;
  source: SourceType;
  action: PageActionType;
  isGGUF: boolean;
  formKey: DeployFormKey;
  sourceDisable?: boolean;
  sourceList?: Global.BaseOption<string>[];
  clusterList: Global.BaseOption<number>[];
  fields?: string[];
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
    initialValues,
    sourceDisable = true,
    sourceList,
    clusterList = [],
    fields = ['source'],
    onSourceChange,
    onValuesChange,
    onOk
  } = props;
  const { scrollToTarget, scrollToBottom } = useWrapperContext();
  const { backendOptions, getBackendOptions } = useQueryBackends();
  const { getGPUOptionList, gpuOptions } = useGenerateGPUOptions();
  const [form] = Form.useForm();
  const intl = useIntl();
  const [activeKey, setActiveKey] = React.useState<string[]>([]);
  const scheduleType = Form.useWatch('scheduleType', form);
  const [target, setTarget] = React.useState<string>('basic');
  const performanceRef = React.useRef<HTMLDivElement>(null);
  const advanceRef = React.useRef<HTMLDivElement>(null);

  const handleSumit = () => {
    form.submit();
  };

  // voxbox is not support multi gpu
  const updateGPUSelector = (backend: string) => {
    const gpuids = form.getFieldValue(['gpu_selector', 'gpu_ids']) || [];

    if (backend === backendOptionsMap.voxBox && gpuids.length > 0) {
      return {
        gpu_selector: { gpu_ids: [gpuids[0]] }
      };
    }
    return {
      gpu_selector: { gpu_ids: gpuids }
    };
  };

  const handleBackendChange = async (val: string, option: BackendOption) => {
    form.setFieldsValue({
      env: null,
      backend_version: option.default_version || '',
      backend_parameters: option.default_backend_param || [],
      ...updateGPUSelector(val)
    });
    props.onBackendChange?.(val);
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
      form.setFieldsValue({
        gpu_selector: { gpu_ids: [] }
      });
    }
  };

  const handleOnValuesChange = async (changedValues: any, allValues: any) => {
    const fieldName = Object.keys(changedValues)[0];

    if (excludeFields.includes(fieldName)) {
      return;
    }
    onValuesChange?.(changedValues, allValues);
  };

  const handleOnCollapseChange = (keys: string | string[]) => {
    setActiveKey(Array.isArray(keys) ? keys : [keys]);
  };

  const handleTargetChange = (val: string) => {
    console.log('val', val);
    // if (val === 'performance' && performanceRef.current) {
    //   scrollToTarget?.(performanceRef.current);
    // }
    // if (val === 'advanced' && advanceRef.current) {
    //   scrollToTarget?.(advanceRef.current);
    // }
    // scrollToBottom?.();
    // setTimeout(() => {
    //   setTarget(val);
    // }, 100);
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
        getBackendOptions(params);
      }
    };
  });

  return (
    <FormContext.Provider
      value={{
        isGGUF: isGGUF,
        formKey: formKey,
        source: props.source,
        pageAction: action,
        gpuOptions: gpuOptions,
        backendOptions: backendOptions,
        onValuesChange: onValuesChange,
        onBackendChange: handleBackendChange
      }}
    >
      {/* <div className="m-b-8">
        <Segmented
          value={target}
          defaultValue="Basic"
          onChange={handleTargetChange}
          options={[
            {
              value: 'basic',
              label: 'Basic'
            },
            {
              value: 'performance',
              label: 'Performance'
            },
            {
              value: 'advanced',
              label: 'Advanced'
            }
          ]}
        />
      </div> */}
      <Form
        name="deployModel"
        form={form}
        onFinish={handleOk}
        preserve={false}
        clearOnDestroy={true}
        onValuesChange={handleOnValuesChange}
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
            // {
            //   key: 'performance',
            //   label: intl.formatMessage({ id: 'models.form.performance' }),
            //   forceRender: true,
            //   extra: <div ref={performanceRef}></div>,
            //   children: <Performance></Performance>
            // },
            {
              key: 'advanced',
              label: intl.formatMessage({ id: 'resources.form.advanced' }),
              forceRender: true,
              extra: <div ref={advanceRef}></div>,
              children: <AdvanceConfig></AdvanceConfig>
            }
          ]}
        ></CollapsePanel>
      </Form>
    </FormContext.Provider>
  );
});

export default DataForm;
