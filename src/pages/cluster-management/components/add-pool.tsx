import LabelSelector from '@/components/label-selector';
import ModalFooter from '@/components/modal-footer';
import ScrollerModal from '@/components/scroller-modal';
import SealInputNumber from '@/components/seal-form/input-number';
import SealInput from '@/components/seal-form/seal-input';
import { PageActionType } from '@/config/types';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import React, { useEffect } from 'react';
import {
  NodePoolFormData as FormData,
  NodePoolListItem as ListItem
} from '../config/types';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  provider: string; // 'kubernetes' | 'custom' | 'digitalocean';
  currentData?: ListItem | null;
  onOk: (values: FormData) => void;
  onCancel: () => void;
};
const AddCluster: React.FC<AddModalProps> = ({
  title,
  action,
  open,
  provider,
  onOk,
  currentData,
  onCancel
}) => {
  const [form] = Form.useForm();
  const intl = useIntl();

  const handleSumit = () => {
    form.submit();
  };

  const handleOnOk = async (data: FormData) => {
    const { volumes, ...rest } = data;

    await onOk({
      ...rest,
      cloud_options: !_.isEmpty(volumes)
        ? {
            volumes: [
              {
                ...volumes
              }
            ]
          }
        : {}
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  useEffect(() => {
    if (currentData) {
      form.setFieldsValue({
        ...currentData,
        volumes: currentData.cloud_options?.volumes?.[0] || {}
      });
    }
  }, [currentData]);

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
      <Form
        form={form}
        onFinish={handleOnOk}
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
          name="os_image"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                { id: 'common.form.rule.input' },
                {
                  name: 'OS Image'
                }
              )
            }
          ]}
        >
          <SealInput.Input label={'OS Image'} required></SealInput.Input>
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
          name="volumes"
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
                          name: 'Volumes'
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
            label="Volumes"
            labels={form.getFieldValue('volumes') || {}}
            btnText="Add Option"
          ></LabelSelector>
        </Form.Item>
      </Form>
    </ScrollerModal>
  );
};

export default AddCluster;
