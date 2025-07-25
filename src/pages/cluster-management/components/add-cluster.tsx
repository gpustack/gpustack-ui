import ModalFooter from '@/components/modal-footer';
import GSDrawer from '@/components/scroller-modal/gs-drawer';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { PageActionType } from '@/config/types';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import {
  ClusterFormData as FormData,
  ClusterListItem as ListItem
} from '../config/types';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  clusterType: string; // 'kubernetes' | 'custom'
  onOk: (values: FormData) => void;
  data?: ListItem;
  onCancel: () => void;
};
const AddCluster: React.FC<AddModalProps> = ({
  title,
  action,
  open,
  clusterType,
  onOk,
  data,
  onCancel
}) => {
  const [form] = Form.useForm();
  const intl = useIntl();

  const handleSumit = () => {
    form.submit();
  };

  return (
    <GSDrawer
      title={title}
      open={open}
      onClose={onCancel}
      destroyOnClose={true}
      closeIcon={false}
      maskClosable={false}
      keyboard={false}
      width={600}
      styles={{}}
      footer={
        <ModalFooter onOk={handleSumit} onCancel={onCancel}></ModalFooter>
      }
    >
      <Form form={form} onFinish={onOk} preserve={false}>
        <Form.Item<FormData>
          name="name"
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
        {clusterType === 'kubernetes' && (
          <>
            {' '}
            <Form.Item<FormData>
              name="provider"
              rules={[
                {
                  required: true,
                  message: intl.formatMessage(
                    { id: 'common.form.rule.input' },
                    {
                      name: 'Provider'
                    }
                  )
                }
              ]}
            >
              <SealSelect
                label="Provider"
                required
                options={['Digital Ocean', 'AutoDL', 'Custom'].map((item) => ({
                  label: item,
                  value: item
                }))}
              ></SealSelect>
            </Form.Item>
            <Form.Item<FormData>
              name="region"
              rules={[
                {
                  required: true,
                  message: intl.formatMessage(
                    { id: 'common.form.rule.input' },
                    {
                      name: 'Region'
                    }
                  )
                }
              ]}
            >
              <SealSelect
                label="Region"
                required
                options={['Hangzhou', 'Guangzhou', 'Shenzhen'].map((item) => ({
                  label: item,
                  value: item
                }))}
              ></SealSelect>
            </Form.Item>
          </>
        )}
        <Form.Item<FormData>
          name="gpuPlan"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                { id: 'common.form.rule.input' },
                {
                  name: 'GPU Plan'
                }
              )
            }
          ]}
        >
          <SealSelect
            label="GPU Plan"
            required
            options={['A100', 'V100', 'T4'].map((item) => ({
              label: item,
              value: item
            }))}
          ></SealSelect>
        </Form.Item>
        <Form.Item<FormData>
          name="workers"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                { id: 'common.form.rule.input' },
                {
                  name: 'Workers'
                }
              )
            }
          ]}
        >
          <SealInput.Number label="Worker Number" required></SealInput.Number>
        </Form.Item>

        <Form.Item<FormData> name="description" rules={[{ required: false }]}>
          <SealInput.TextArea
            label={intl.formatMessage({ id: 'common.table.description' })}
          ></SealInput.TextArea>
        </Form.Item>
      </Form>
    </GSDrawer>
  );
};

export default AddCluster;
