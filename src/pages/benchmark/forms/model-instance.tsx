import { PageAction } from '@/config';
import {
  InstanceStatusMap,
  InstanceStatusMapValue,
  modelCategoriesMap
} from '@/pages/llmodels/config';
import { useBenchmarkTargetInstance } from '@/pages/llmodels/hooks/use-run-benchmark';
import { useQueryModelInstancesList } from '@/pages/llmodels/services/use-query-model-instances';
import { useQueryModelList } from '@/pages/llmodels/services/use-query-model-list';
import { Cascader as SealCascader, useAppUtils } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { Form, Tooltip } from 'antd';
import React, { useEffect } from 'react';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';

// benchmark.form.nonLlmModel.tips
const InstanceNode = (props: any) => {
  const { data: instance } = props;
  const intl = useIntl();
  return instance.isLeaf ? (
    <span className="flex-center">
      {instance.label}
      {instance.disabled && (
        <span className="text-tertiary m-l-4">[{instance.state}]</span>
      )}
    </span>
  ) : (
    <>
      {instance.disabled ? (
        <Tooltip
          title={intl.formatMessage({ id: 'benchmark.form.nonLlmModel.tips' })}
        >
          <span>{instance.label}</span>
        </Tooltip>
      ) : (
        <span>{instance.label}</span>
      )}
    </>
  );
};

const ModelInstanceForm: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const { getRuleMessage } = useAppUtils();
  const { action, open } = useFormContext();
  const clusterId = Form.useWatch('cluster_id', form);
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

  const clearModelInstance = () => {
    setModelList([]);
    form.setFieldsValue({
      model_name: '',
      model_id: '',
      model_instance_name: '',
      model_instance: ''
    });
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
  const initModelInstance = useMemoizedFn(async () => {
    if (!clusterId) {
      return;
    }
    // fetch model list when dropdown is opened
    const list = await fetchModelList({ page: -1, cluster_id: clusterId });
    const modelOptions = list
      .filter((model: any) => model.replicas > 0)
      .map((model: any) => ({
        label: model.name,
        value: model.name,
        disabled: modelCategoriesMap.llm !== model.categories?.[0],
        id: model.id,
        isLeaf: false,
        ready_replicas: model.ready_replicas,
        children: []
      }));

    if (modelOptions.length === 0) {
      clearModelInstance();
      return;
    }

    // preload instances for the first model
    const selectedllmModel = modelOptions.find(
      (model) => !model.disabled && model.ready_replicas > 0
    );
    if (!selectedllmModel) {
      setModelList(modelOptions);
      form.setFieldsValue({
        model_name: '',
        model_id: '',
        model_instance_name: '',
        model_instance: ''
      });
      return;
    }
    const instanceList = await fetchInstanceList({ id: selectedllmModel.id });
    const instanceOptions = instanceList.map((instance: any) =>
      renderInstance(instance)
    );
    if (selectedllmModel) {
      selectedllmModel.children = [...instanceOptions] as never[];
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
        [selectedllmModel.value, instanceOptions[0]?.value],
        [selectedllmModel, instanceOptions[0]]
      );
    }

    setModelList(modelOptions);
  });

  useEffect(() => {
    if (open && action === PageAction.CREATE) {
      initModelInstance();
    }
    if (!open) {
      cancelModelRequest();
      cancelInstanceRequest();
      clearBenchmarkTargetInstance();
    }
  }, [open, action, clusterId]);

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
