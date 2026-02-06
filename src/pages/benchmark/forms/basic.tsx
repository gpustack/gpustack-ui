import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { modelNameReg, PageAction } from '@/config';
import useAppUtils from '@/hooks/use-app-utils';
import { ClusterStatusValueMap } from '@/pages/cluster-management/config';
import { useBenchmarkTargetInstance } from '@/pages/llmodels/hooks/use-run-benchmark';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React, { useEffect } from 'react';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';
import ModelInstanceForm from './model-instance';

const BasicForm: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const { getRuleMessage } = useAppUtils();
  const { action, open, clusterList } = useFormContext();
  const { benchmarkTargetInstance } = useBenchmarkTargetInstance();

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
    if (
      clusterList &&
      clusterList?.length > 0 &&
      action === PageAction.CREATE
    ) {
      form.setFieldValue(
        'cluster_id',
        benchmarkTargetInstance.cluster_id || initClusterId(clusterList)
      );
    }
  }, [form, action, clusterList, benchmarkTargetInstance]);

  return (
    <>
      <Form.Item<FormData>
        data-field="name"
        name="name"
        rules={[
          {
            required: true,
            message: getRuleMessage('input', 'common.table.name')
          },
          {
            pattern: modelNameReg,
            message: intl.formatMessage({ id: 'models.form.rules.name' })
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
          disabled={action === PageAction.EDIT}
          options={clusterList}
          label={intl.formatMessage({ id: 'clusters.title' })}
          required
        ></SealSelect>
      </Form.Item>
      <Form.Item<FormData> name="model_name" hidden={true}>
        <SealInput.Input></SealInput.Input>
      </Form.Item>
      <Form.Item<FormData> name="model_id" hidden={true}>
        <SealInput.Input></SealInput.Input>
      </Form.Item>
      <Form.Item<FormData> name="model_instance_name" hidden={true}>
        <SealInput.Input></SealInput.Input>
      </Form.Item>
      <ModelInstanceForm></ModelInstanceForm>
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
