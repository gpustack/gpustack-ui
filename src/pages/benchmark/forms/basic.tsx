import LabelSelector from '@/components/label-selector';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { PageAction } from '@/config';
import useAppUtils from '@/hooks/use-app-utils';
import { ClusterStatusValueMap } from '@/pages/cluster-management/config';
import { useQueryClusterList } from '@/pages/cluster-management/services/use-query-cluster-list';
import {
  InstanceStatusMap,
  InstanceStatusMapValue
} from '@/pages/llmodels/config';
import { useQueryModelInstancesList } from '@/pages/llmodels/services/use-query-model-instances';
import { useQueryModelList } from '@/pages/llmodels/services/use-query-model-list';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import React, { useEffect } from 'react';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';

const BasicForm: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const labels = Form.useWatch('labels', form);
  const { getRuleMessage } = useAppUtils();
  const { action, open } = useFormContext();
  const {
    loading: clusterLoading,
    fetchClusterList,
    cancelRequest: cancelClusterRequest,
    clusterList
  } = useQueryClusterList();
  const {
    loading: modelLoading,
    fetchData: fetchModelList,
    cancelRequest: cancelModelRequest,
    dataList: modelList
  } = useQueryModelList();
  const {
    loading: instanceLoading,
    fetchInstanceList,
    cancelRequest: cancelInstanceRequest,
    instanceList
  } = useQueryModelInstancesList();

  const handleLabelsChange = (labels: object) => {
    form.setFieldValue('labels', labels);
  };

  const onModelListOpenChange = async (open: boolean) => {
    if (open && modelList.length === 0) {
      await form.validateFields(['cluster_id']);
      const cluster_id = form.getFieldValue('cluster_id');
      if (cluster_id) {
        fetchModelList({ page: -1, cluster_id });
      }
    }
  };

  const onInstanceOpenChange = async (open: boolean) => {
    if (open && instanceList.length === 0) {
      const model_id = form.getFieldValue('model_id');
      await form.validateFields(['model_name']);
      if (model_id) fetchInstanceList({ id: model_id });
    }
  };

  const handleOnModelChange = (value: string, option: any) => {
    form.setFieldValue('model_id', option?.id);
  };

  const optionRender = (option: any) => {
    return (
      <span className="flex-center">
        {option.label}
        <span className="text-tertiary m-l-4">{`[${InstanceStatusMapValue[option.data?.state]}]`}</span>
      </span>
    );
  };

  useEffect(() => {
    const initClusterId = (list: any[]) => {
      // Find default cluster
      const defaultCluster = list?.find((item) => item.is_default);
      if (defaultCluster) {
        return defaultCluster.id;
      }

      const cluster_id =
        list?.find((item) => item.state === ClusterStatusValueMap.Ready)?.id ||
        list?.[0]?.id;

      return cluster_id;
    };
    fetchClusterList({ page: -1 }).then((list) => {
      if (list.length > 0 && action === PageAction.CREATE) {
        form.setFieldValue('cluster_id', initClusterId(list));
      }
    });
  }, [form, action]);

  useEffect(() => {
    if (!open) {
      cancelClusterRequest();
      cancelModelRequest();
      cancelInstanceRequest();
    }
  }, [open]);

  return (
    <>
      <Form.Item<FormData>
        data-field="name"
        name="name"
        rules={[
          {
            required: true,
            message: getRuleMessage('input', 'common.table.name')
          }
        ]}
      >
        <SealInput.Input
          label={intl.formatMessage({ id: 'common.table.name' })}
          required
        ></SealInput.Input>
      </Form.Item>
      <Form.Item<FormData>
        name="cluster_id"
        rules={[
          {
            required: true,
            message: getRuleMessage('select', 'clusters.title')
          }
        ]}
      >
        <SealSelect
          loading={clusterLoading}
          options={clusterList}
          label={intl.formatMessage({ id: 'clusters.title' })}
          required
        ></SealSelect>
      </Form.Item>
      <Form.Item<FormData>
        name="model_name"
        rules={[
          {
            required: true,
            message: getRuleMessage('select', 'benchmark.table.model')
          }
        ]}
      >
        <SealSelect
          loading={modelLoading}
          options={modelList.map((item) => ({
            ...item,
            label: item.name,
            value: item.name
          }))}
          onOpenChange={onModelListOpenChange}
          onChange={handleOnModelChange}
          label={intl.formatMessage({ id: 'benchmark.table.model' })}
          required
        ></SealSelect>
      </Form.Item>
      <Form.Item<FormData> name="model_id" hidden={true}>
        <SealInput.Input></SealInput.Input>
      </Form.Item>
      <Form.Item<FormData>
        name="model_instance_name"
        rules={[
          {
            required: true,
            message: getRuleMessage('select', 'benchmark.table.instance')
          }
        ]}
      >
        <SealSelect
          loading={instanceLoading}
          options={instanceList.map((item) => ({
            ...item,
            disabled: item.state !== InstanceStatusMap.Running
          }))}
          optionRender={optionRender}
          onOpenChange={onInstanceOpenChange}
          label={intl.formatMessage({ id: 'benchmark.table.instance' })}
          required
        ></SealSelect>
      </Form.Item>
      <Form.Item<FormData>
        name="labels"
        rules={[
          () => ({
            validator(rule, value) {
              if (_.keys(value).length > 0) {
                if (_.some(_.keys(value), (k: string) => !value[k])) {
                  return Promise.reject(
                    intl.formatMessage(
                      {
                        id: 'common.validate.value'
                      },
                      {
                        name: intl.formatMessage({
                          id: 'resources.form.label'
                        })
                      }
                    )
                  );
                }
              }
              return Promise.resolve();
            }
          })
        ]}
      >
        <LabelSelector
          label={intl.formatMessage({
            id: 'resources.table.labels'
          })}
          labels={labels}
          btnText={intl.formatMessage({ id: 'common.button.addLabel' })}
          onChange={handleLabelsChange}
        ></LabelSelector>
      </Form.Item>
      <Form.Item<FormData> name="description">
        <SealInput.TextArea
          scaleSize={true}
          label={intl.formatMessage({
            id: 'common.table.description'
          })}
        ></SealInput.TextArea>
      </Form.Item>
    </>
  );
};

export default BasicForm;
