import SealCascader from '@/components/seal-form/seal-cascader';
import { PageAction } from '@/config';
import useAppUtils from '@/hooks/use-app-utils';
import {
  InstanceStatusMap,
  InstanceStatusMapValue
} from '@/pages/llmodels/config';
import { useBenchmarkTargetInstance } from '@/pages/llmodels/hooks/use-run-benchmark';
import { useQueryModelInstancesList } from '@/pages/llmodels/services/use-query-model-instances';
import { useQueryModelList } from '@/pages/llmodels/services/use-query-model-list';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React, { useEffect } from 'react';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';

const InstanceNode = (props: any) => {
  const { data: instance } = props;
  return instance.isLeaf ? (
    <span className="flex-center">
      {instance.label}
      {instance.disabled && (
        <span className="text-tertiary m-l-4">[{instance.state}]</span>
      )}
    </span>
  ) : (
    <span>{instance.label}</span>
  );
};

const ModelInstanceForm: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const { getRuleMessage } = useAppUtils();
  const { action, open } = useFormContext();
  const [modelList, setModelList] = React.useState<any[]>([]);
  const {
    loading: modelLoading,
    fetchData: fetchModelList,
    cancelRequest: cancelModelRequest
  } = useQueryModelList();
  const {
    loading: instanceLoading,
    fetchInstanceList,
    cancelRequest: cancelInstanceRequest
  } = useQueryModelInstancesList();
  const { benchmarkTargetInstance, clearBenchmarkTargetInstance } =
    useBenchmarkTargetInstance();

  const handleOnChange = async (value: any, selectedOptions: any) => {
    form.setFieldsValue({
      model_name: value[0],
      model_id: selectedOptions[0]?.id,
      model_instance_name: value[1],
      model_instance: value
    });
  };

  const renderInstance = (instance: any) => {
    return {
      label: instance.name,
      value: instance.name,
      id: instance.id,
      isLeaf: true,
      disabled: instance.state !== InstanceStatusMap.Running,
      state: InstanceStatusMapValue[instance.state]
    };
  };

  const loadInstances = async (selectedOptions: any[]) => {
    const targetOption = selectedOptions[selectedOptions.length - 1];
    if (targetOption && targetOption.children.length === 0) {
      const list = await fetchInstanceList({ id: targetOption.id });
      const instanceOptions = list.map((instance: any) =>
        renderInstance(instance)
      );
      targetOption.children = [...instanceOptions];

      setModelList((prevModelList) => {
        const newModelList = prevModelList.map((model) => {
          if (model.id === targetOption.id) {
            return {
              ...model,
              children: [...instanceOptions]
            };
          }
          return model;
        });
        return newModelList;
      });
    }
  };

  const initModelInstance = async () => {
    // fetch model list when dropdown is opened
    const list = await fetchModelList({ page: -1 });
    const modelOptions = list
      .filter((model: any) => model.replicas > 0)
      .map((model: any) => ({
        label: model.name,
        value: model.name,
        id: model.id,
        isLeaf: false,
        children: []
      }));

    if (modelOptions.length === 0) {
      return;
    }

    // preload instances for the first model
    const instanceList = await fetchInstanceList({ id: modelOptions[0]?.id });
    const instanceOptions = instanceList.map((instance: any) =>
      renderInstance(instance)
    );
    if (modelOptions[0]) {
      modelOptions[0].children = [...instanceOptions] as never[];
    }

    // init form value for model instance
    if (
      benchmarkTargetInstance.model_name &&
      benchmarkTargetInstance.model_instance_name
    ) {
      form.setFieldsValue({
        ...benchmarkTargetInstance
      });
    } else {
      handleOnChange(
        [modelOptions[0].value, instanceOptions[0]?.value],
        [modelOptions[0], instanceOptions[0]]
      );
    }

    setModelList(modelOptions);
  };

  useEffect(() => {
    if (open) {
      initModelInstance();
    }
    if (!open) {
      cancelModelRequest();
      cancelInstanceRequest();
      clearBenchmarkTargetInstance();
    }
  }, [open, benchmarkTargetInstance]);

  return (
    <Form.Item<FormData>
      name={'model_instance'}
      rules={[
        {
          required: true,
          message: getRuleMessage('select', 'benchmark.table.instance')
        }
      ]}
    >
      <SealCascader
        required
        showSearch
        disabled={action === PageAction.EDIT}
        loading={modelLoading || instanceLoading}
        changeOnSelect={false}
        expandTrigger="hover"
        multiple={false}
        classNames={{
          popup: {
            root: 'cascader-popup-wrapper gpu-selector'
          }
        }}
        maxTagCount={1}
        label={intl.formatMessage({ id: 'benchmark.table.instance' })}
        options={modelList}
        getPopupContainer={(triggerNode) => triggerNode.parentNode}
        optionNode={InstanceNode}
        loadData={loadInstances}
        onChange={handleOnChange}
      ></SealCascader>
    </Form.Item>
  );
};

export default ModelInstanceForm;
