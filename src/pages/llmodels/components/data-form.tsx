import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import TooltipList from '@/components/tooltip-list';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import React, { forwardRef, useImperativeHandle } from 'react';
import {
  backendLabelMap,
  backendOptionsMap,
  backendTipsList,
  excludeFields,
  modelSourceMap,
  sourceOptions
} from '../config';
import { FormInnerContext } from '../config/form-context';
import { FormData, SourceType } from '../config/types';
import CatalogFrom from '../forms/catalog';
import HuggingFaceForm from '../forms/hugging-face';
import LocalPathForm from '../forms/local-path';
import AdvanceConfig from './advance-config';

interface DataFormProps {
  initialValues?: any;
  ref?: any;
  source: SourceType;
  action: PageActionType;
  selectedModel: any;
  isGGUF: boolean;
  sourceDisable?: boolean;
  backendOptions?: Global.BaseOption<string>[];
  sourceList?: Global.BaseOption<string>[];
  gpuOptions: any[];
  modelFileOptions?: any[];
  fields?: string[];
  onValuesChange?: (changedValues: any, allValues: any) => void;
  onSourceChange?: (value: string) => void;
  onOk: (values: FormData) => void;
  onBackendChange?: (value: string) => void;
}

const SEARCH_SOURCE = [
  modelSourceMap.huggingface_value,
  modelSourceMap.modelscope_value
];

const DataForm: React.FC<DataFormProps> = forwardRef((props, ref) => {
  const {
    action,
    isGGUF,
    initialValues,
    sourceDisable = true,
    backendOptions,
    sourceList,
    gpuOptions = [],
    modelFileOptions = [],
    fields = ['source'],
    onSourceChange,
    onValuesChange,
    onOk
  } = props;
  const { getRuleMessage } = useAppUtils();
  const [form] = Form.useForm();
  const intl = useIntl();

  const handleSumit = () => {
    form.submit();
  };

  // voxbox is not support multi gpu
  const handleSetGPUIds = (backend: string) => {
    const gpuids = form.getFieldValue(['gpu_selector', 'gpu_ids']) || [];

    if (backend === backendOptionsMap.voxBox && gpuids.length > 0) {
      form.setFieldValue(['gpu_selector', 'gpu_ids'], [gpuids[0]]);
    }
  };

  const handleBackendChange = async (val: string) => {
    const updates = {
      backend_version: ''
    };
    if (val === backendOptionsMap.llamaBox) {
      Object.assign(updates, {
        distributed_inference_across_workers: true,
        cpu_offloading: true
      });
    }
    form.setFieldsValue({
      ...updates,
      backend_parameters: [],
      env: null
    });
    handleSetGPUIds(val);
    props.onBackendChange?.(val);
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
        gpu_ids: result
      }
    };
  };

  // generate the data is available for the backend including the gpu_ids
  const handleOk = async (formdata: FormData) => {
    let data = _.cloneDeep(formdata);
    data.categories = Array.isArray(data.categories)
      ? data.categories
      : data.categories
        ? [data.categories]
        : [];
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

  const handleOnValuesChange = async (changedValues: any, allValues: any) => {
    const fieldName = Object.keys(changedValues)[0];

    if (excludeFields.includes(fieldName)) {
      return;
    }
    onValuesChange?.(changedValues, allValues);
  };

  useImperativeHandle(
    ref,
    () => {
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
        }
      };
    },
    []
  );

  return (
    <Form
      name="deployModel"
      form={form}
      onFinish={handleOk}
      preserve={false}
      style={{ padding: '16px 24px' }}
      clearOnDestroy={true}
      onValuesChange={handleOnValuesChange}
      scrollToFirstError={true}
      initialValues={{
        replicas: 1,
        source: props.source,
        placement_strategy: 'spread',
        cpu_offloading: true,
        scheduleType: 'auto',
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

      <FormInnerContext.Provider
        value={{
          onBackendChange: handleBackendChange,
          onValuesChange: onValuesChange,
          gpuOptions: gpuOptions
        }}
      >
        <HuggingFaceForm></HuggingFaceForm>
        <LocalPathForm></LocalPathForm>
      </FormInnerContext.Provider>
      <Form.Item name="backend" rules={[{ required: true }]}>
        <SealSelect
          required
          onChange={handleBackendChange}
          label={intl.formatMessage({ id: 'models.form.backend' })}
          description={<TooltipList list={backendTipsList}></TooltipList>}
          options={
            backendOptions ?? [
              {
                label: backendLabelMap[backendOptionsMap.llamaBox],
                value: backendOptionsMap.llamaBox,
                disabled:
                  props.source === modelSourceMap.local_path_value
                    ? false
                    : !isGGUF
              },
              {
                label: backendLabelMap[backendOptionsMap.vllm],
                value: backendOptionsMap.vllm,
                disabled:
                  props.source === modelSourceMap.local_path_value
                    ? false
                    : isGGUF
              },
              {
                label: backendLabelMap[backendOptionsMap.ascendMindie],
                value: backendOptionsMap.ascendMindie,
                disabled:
                  props.source === modelSourceMap.local_path_value
                    ? false
                    : isGGUF
              },
              {
                label: backendLabelMap[backendOptionsMap.voxBox],
                value: backendOptionsMap.voxBox,
                disabled:
                  props.source === modelSourceMap.local_path_value
                    ? false
                    : props.source === modelSourceMap.ollama_library_value ||
                      isGGUF
              }
            ]
          }
          disabled={
            action === PageAction.EDIT &&
            props.source !== modelSourceMap.local_path_value
          }
        ></SealSelect>
      </Form.Item>
      <CatalogFrom></CatalogFrom>
      <Form.Item<FormData>
        name="replicas"
        rules={[
          {
            required: true,
            message: getRuleMessage('input', 'models.form.replicas')
          }
        ]}
      >
        <SealInput.Number
          style={{ width: '100%' }}
          label={intl.formatMessage({
            id: 'models.form.replicas'
          })}
          required
          description={intl.formatMessage(
            { id: 'models.form.replicas.tips' },
            { api: `${window.location.origin}/v1` }
          )}
          min={0}
        ></SealInput.Number>
      </Form.Item>
      <Form.Item<FormData> name="description">
        <SealInput.TextArea
          scaleSize={true}
          label={intl.formatMessage({
            id: 'common.table.description'
          })}
        ></SealInput.TextArea>
      </Form.Item>
      <AdvanceConfig
        form={form}
        gpuOptions={gpuOptions}
        isGGUF={isGGUF}
        action={action}
        source={props.source}
      ></AdvanceConfig>
    </Form>
  );
});

export default React.memo(DataForm);
