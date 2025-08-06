import ModalFooter from '@/components/modal-footer';
import ScrollerModal from '@/components/scroller-modal/index';
import SealInput from '@/components/seal-form/seal-input';
import { PageActionType } from '@/config/types';
import { CloseOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Form } from 'antd';
import React from 'react';
import {
  ClusterFormData as FormData,
  ClusterListItem as ListItem
} from '../config/types';
import CloudProvider from './cloud-provider-form';
import K8SProvider from './k8s-provider-form';

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

  const handleSubmit = () => {
    form.submit();
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <ScrollerModal
      title={
        <div className="flex-between flex-center">
          <span>{title}</span>
          <Button type="text" size="small" onClick={handleCancel}>
            <CloseOutlined></CloseOutlined>
          </Button>
        </div>
      }
      open={open}
      onClose={onCancel}
      destroyOnClose={true}
      closeIcon={false}
      maskClosable={false}
      keyboard={false}
      width={600}
      styles={{}}
      footer={
        <ModalFooter onOk={handleSubmit} onCancel={onCancel}></ModalFooter>
      }
    >
      <Form form={form} onFinish={onOk} preserve={false}>
        <Form.Item<FormData>
          name="display_name"
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
        {provider === 'digitalocean' && (
          <CloudProvider provider={provider}></CloudProvider>
        )}
        {provider === 'kubernetes' && (
          <K8SProvider provider={provider}></K8SProvider>
        )}
        <Form.Item<FormData> name="description" rules={[{ required: false }]}>
          <SealInput.TextArea
            label={intl.formatMessage({ id: 'common.table.description' })}
          ></SealInput.TextArea>
        </Form.Item>
      </Form>
    </ScrollerModal>
  );
};

export default AddCluster;
