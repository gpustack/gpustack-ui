import LabelSelector from '@/components/label-selector';
import ModalFooter from '@/components/modal-footer';
import ScrollerModal from '@/components/scroller-modal';
import SealInputNumber from '@/components/seal-form/input-number';
import SealInput from '@/components/seal-form/seal-input';
import { PageActionType } from '@/config/types';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import React from 'react';
import {
  NodePoolFormData as FormData,
  NodePoolListItem as ListItem
} from '../config/types';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  provider: string; // 'kubernetes' | 'custom' | 'digitalocean';
  onOk: (values: FormData) => void;
  data?: ListItem;
  onCancel: () => void;
};
const AddCluster: React.FC<AddModalProps> = ({
  title,
  action,
  open,
  provider,
  onOk,
  data,
  onCancel
}) => {
  const [form] = Form.useForm();
  const intl = useIntl();

  const handleSumit = () => {
    form.submit();
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <ScrollerModal
      title={title}
      open={open}
      onCancel={handleCancel}
      destroyOnHidden={true}
      closeIcon={true}
      maskClosable={false}
      keyboard={false}
      width={600}
      footer={
        <ModalFooter onOk={handleSumit} onCancel={onCancel}></ModalFooter>
      }
    >
      <Form form={form} onFinish={onOk} preserve={false}>
        <Form.Item<FormData>
          name="instance_type"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                { id: 'common.form.rule.input' },
                {
                  name: intl.formatMessage({ id: 'common.table.name' })
                }
              )
            }
          ]}
        >
          <SealInput.Input
            label={intl.formatMessage({ id: 'common.table.name' })}
            required
          ></SealInput.Input>
        </Form.Item>
        <Form.Item<FormData>
          name="replicas"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                { id: 'common.form.rule.input' },
                {
                  name: 'Replicas'
                }
              )
            }
          ]}
        >
          <SealInputNumber label="Replicas" required></SealInputNumber>
        </Form.Item>
        <Form.Item<FormData>
          name="batch_size"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                { id: 'common.form.rule.input' },
                {
                  name: 'Batch Size'
                }
              )
            }
          ]}
        >
          <SealInputNumber label="Batch Size" required></SealInputNumber>
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
            label="Labels"
            labels={form.getFieldValue('labels') || {}}
            btnText="Add Label"
          ></LabelSelector>
        </Form.Item>
        <Form.Item<FormData>
          name="cloud_options"
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
                          name: 'cloud_options'
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
            label="Cloud Options"
            labels={form.getFieldValue('cloud_options') || {}}
            btnText="Add Option"
          ></LabelSelector>
        </Form.Item>
      </Form>
    </ScrollerModal>
  );
};

export default AddCluster;
