import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { PageActionType } from '@/config/types';
import useAppUtils from '@/hooks/use-app-utils';
import CollapsePanel from '@/pages/_components/collapse-panel';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import React, { forwardRef, useImperativeHandle } from 'react';
import { excludeFields, ScheduleValueMap, sourceOptions } from '../config';
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
import CatalogFrom from './catalog';
import LocalPathSource from './local-path-source';
import OnlineSource from './online-source';
// import AdvanceConfig from './advance-config';
import AdvanceConfig from './advance-config';
import Performance from './performance';

interface DataFormProps {
  initialValues?: any;
  ref?: any;
  source: SourceType;
  action: PageActionType;
  isGGUF: boolean;
  formKey: DeployFormKey;
  sourceDisable?: boolean;
  backendOptions: BackendOption[];
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
    backendOptions = [],
    sourceList,
    clusterList = [],
    fields = ['source'],
    onSourceChange,
    onValuesChange,
    onOk
  } = props;
  const { getGPUOptionList, gpuOptions } = useGenerateGPUOptions();
  const { getRuleMessage } = useAppUtils();
  const [form] = Form.useForm();
  const intl = useIntl();
  const [activeKey, setActiveKey] = React.useState<string[]>([]);

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

  const handleOnSourceChange = (val: string) => {
    onSourceChange?.(val);
  };

  const handleClusterChange = (value: number) => {
    getGPUOptionList({ clusterId: value });
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
          ...initialValues
        }}
      >
        <Form.Item<FormData>
          name="name"
          rules={[
            {
              required: true,
              message: getRuleMessage('input', 'common.table.name')
            }
          ]}
        >
          <SealInput.Input
            label={intl.formatMessage({
              id: 'common.table.name'
            })}
            required
          ></SealInput.Input>
        </Form.Item>
        {fields.includes('source') && (
          <Form.Item<FormData>
            name="source"
            rules={[
              {
                required: true,
                message: getRuleMessage('select', 'models.form.source')
              }
            ]}
          >
            {
              <SealSelect
                onChange={handleOnSourceChange}
                disabled={sourceDisable}
                label={intl.formatMessage({
                  id: 'models.form.source'
                })}
                options={sourceList ?? sourceOptions}
                required
              ></SealSelect>
            }
          </Form.Item>
        )}

        <OnlineSource></OnlineSource>
        <LocalPathSource></LocalPathSource>
        <Form.Item<FormData>
          name="cluster_id"
          rules={[
            {
              required: true,
              message: getRuleMessage('select', 'clusters.title')
            }
          ]}
        >
          {
            <SealSelect
              onChange={handleClusterChange}
              label={intl.formatMessage({ id: 'clusters.title' })}
              options={clusterList}
              required
            ></SealSelect>
          }
        </Form.Item>
        <CatalogFrom></CatalogFrom>
        <Form.Item<FormData> name="description">
          <SealInput.TextArea
            scaleSize={true}
            label={intl.formatMessage({
              id: 'common.table.description'
            })}
          ></SealInput.TextArea>
        </Form.Item>
        <CollapsePanel
          activeKey={activeKey}
          accordion={false}
          onChange={handleOnCollapseChange}
          items={[
            {
              key: 'performance',
              label: 'Performance',
              forceRender: true,
              children: <Performance></Performance>
            },
            {
              key: 'advance_config',
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
