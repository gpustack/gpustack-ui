import LabelSelector from '@/components/label-selector';
import SealInputNumber from '@/components/seal-form/input-number';
import SealInput from '@/components/seal-form/seal-input';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef
} from 'react';
import {
  NodePoolFormData as FormData,
  NodePoolListItem as ListItem
} from '../config/types';
import CloudOptions from './cloud-options';

type AddModalProps = {
  ref: any;
  action: PageActionType;
  provider: string; // 'kubernetes' | 'custom' | 'digitalocean';
  currentData?: ListItem | null;
  onFinish: (values: FormData) => void;
};
const PoolForm: React.FC<AddModalProps> = forwardRef(
  ({ action, onFinish, currentData }, ref) => {
    const cloudOptionsRef = useRef<any>(null);
    const [form] = Form.useForm();
    const intl = useIntl();
    const { getRuleMessage } = useAppUtils();

    useEffect(() => {
      if (currentData) {
        form.setFieldsValue({
          ...currentData,
          volumes: currentData.cloud_options?.volumes?.[0] || {}
        });
        cloudOptionsRef.current?.initFieldList();
      }
    }, [currentData]);

    useImperativeHandle(ref, () => ({
      reset: () => {
        form.resetFields();
      },
      submit: () => {
        form.submit();
      },
      validateFields: async () => {
        return await form.validateFields();
      }
    }));

    return (
      <Form
        form={form}
        onFinish={onFinish}
        preserve={false}
        initialValues={{
          replicas: 1,
          batch_size: 1
        }}
      >
        <Form.Item<FormData>
          name="instance_type"
          rules={[
            {
              required: true,
              message: getRuleMessage(
                'input',
                'clusters.workerpool.instanceType'
              )
            }
          ]}
        >
          <SealInput.Input
            label={intl.formatMessage({
              id: 'clusters.workerpool.instanceType'
            })}
            required
          ></SealInput.Input>
        </Form.Item>
        <Form.Item<FormData>
          name="replicas"
          rules={[
            {
              required: true,
              message: getRuleMessage('input', 'clusters.workerpool.replicas')
            }
          ]}
        >
          <SealInputNumber
            label={intl.formatMessage({ id: 'clusters.workerpool.replicas' })}
            required
          ></SealInputNumber>
        </Form.Item>
        <Form.Item<FormData>
          name="batch_size"
          rules={[
            {
              required: true,
              message: getRuleMessage('input', 'clusters.workerpool.batchSize')
            }
          ]}
        >
          <SealInputNumber
            label={intl.formatMessage({ id: 'clusters.workerpool.batchSize' })}
            required
          ></SealInputNumber>
        </Form.Item>
        <Form.Item<FormData>
          name="os_image"
          rules={[
            {
              required: true,
              message: getRuleMessage('input', 'clusters.workerpool.osImage')
            }
          ]}
        >
          <SealInput.Input
            disabled={action === PageAction.EDIT}
            label={intl.formatMessage({ id: 'clusters.workerpool.osImage' })}
            required
          ></SealInput.Input>
        </Form.Item>

        <Form.Item<FormData>
          name="labels"
          rules={[
            ({ getFieldValue }) => ({
              validator(rule, value) {
                if (_.keys(value).length > 0) {
                  if (_.some(_.keys(value), (k: string) => !value[k])) {
                    return Promise.reject(
                      intl.formatMessage(
                        {
                          id: 'common.validate.value'
                        },
                        {
                          name: 'labels'
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
            label={intl.formatMessage({ id: 'resources.table.labels' })}
            labels={form.getFieldValue('labels') || {}}
            btnText={intl.formatMessage({ id: 'common.button.addLabel' })}
          ></LabelSelector>
        </Form.Item>
        <CloudOptions ref={cloudOptionsRef}></CloudOptions>
      </Form>
    );
  }
);

export default PoolForm;
