import LabelSelector from '@/components/label-selector';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import React from 'react';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';

const BasicForm: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const labels = Form.useWatch('labels', form);
  const { getRuleMessage } = useAppUtils();
  const { modelList, modelInstanceList, clusterList } = useFormContext();

  const handleLabelsChange = (labels: object) => {
    form.setFieldValue('labels', labels);
  };

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
          options={clusterList}
          label={intl.formatMessage({ id: 'clusters.title' })}
          required
        ></SealSelect>
      </Form.Item>
      <Form.Item<FormData>
        name="model_id"
        rules={[
          {
            required: true,
            message: getRuleMessage('select', 'benchmark.table.model')
          }
        ]}
      >
        <SealSelect
          options={modelList}
          label={intl.formatMessage({ id: 'benchmark.table.model' })}
          required
        ></SealSelect>
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
          options={modelInstanceList}
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
