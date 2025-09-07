import CollapsibleContainer, {
  CollapsibleContainerProps
} from '@/components/collapse-container';
import LabelSelector from '@/components/label-selector';
import SealInputNumber from '@/components/seal-form/input-number';
import SealInput from '@/components/seal-form/seal-input';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import useAppUtils from '@/hooks/use-app-utils';
import { DeleteOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Form } from 'antd';
import _ from 'lodash';
import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import styled from 'styled-components';
import { ProviderType } from '../config';
import { NodePoolFormData as FormData } from '../config/types';
import VolumesConfig from './volumes-config';

const Container = styled.div`
  pointer-events: auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 0 16px;
  .ant-form-item:nth-child(5) {
    grid-column: 1 / 3;
  }

  .ant-form-item:nth-child(6) {
    grid-column: 1 / 3;
  }
`;

type AddModalProps = {
  ref: any;
  name?: string;
  action: PageActionType;
  provider: ProviderType; // 'kubernetes' | 'custom' | 'digitalocean';
  currentData?: FormData | null;
  onFinish: (values: FormData) => void;
  onDelete?: () => void;
  showDelete?: boolean;
  collapseProps?: CollapsibleContainerProps;
};
const PoolForm: React.FC<AddModalProps> = forwardRef((props, ref) => {
  const {
    action,
    name = 'workerPoolForm',
    onFinish,
    onDelete,
    showDelete,
    currentData,
    collapseProps
  } = props;
  const { collapsible, onToggle, ...restCollapseProps } = collapseProps || {};
  const [form] = Form.useForm();
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();
  const labels = Form.useWatch('labels', form);
  const instance_type = Form.useWatch('instance_type', form);

  useEffect(() => {
    if (currentData) {
      console.log('currentData===========1=', currentData);
      form.setFieldsValue({
        ...currentData
      });
    }
  }, [currentData]);

  useImperativeHandle(ref, () => ({
    resetFields: () => {
      form.resetFields();
    },
    submit: () => {
      form.submit();
    },
    setFieldsValue: (values: any) => {
      form.setFieldsValue(values);
    },
    getFieldsValue: () => {
      return form.getFieldsValue();
    },
    validateFields: async () => {
      return await form.validateFields();
    }
  }));

  return (
    <CollapsibleContainer
      title={instance_type}
      collapsible={collapsible}
      onToggle={onToggle}
      {...restCollapseProps}
    >
      {showDelete && (
        <div className="flex-end" style={{ marginBlock: '8px 16px' }}>
          <Button
            onClick={onDelete}
            icon={<DeleteOutlined />}
            danger
            type="text"
            variant="filled"
            color="danger"
            size="small"
          ></Button>
        </div>
      )}
      <Form
        name={name}
        form={form}
        onFinish={onFinish}
        preserve={false}
        scrollToFirstError={true}
        initialValues={{
          replicas: 1,
          batch_size: 1
        }}
      >
        <Container>
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
              label={intl.formatMessage({
                id: 'clusters.workerpool.replicas'
              })}
              required
            ></SealInputNumber>
          </Form.Item>
          <Form.Item<FormData>
            name="batch_size"
            rules={[
              {
                required: true,
                message: getRuleMessage(
                  'input',
                  'clusters.workerpool.batchSize'
                )
              }
            ]}
          >
            <SealInputNumber
              label={intl.formatMessage({
                id: 'clusters.workerpool.batchSize'
              })}
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
              label={intl.formatMessage({
                id: 'clusters.workerpool.osImage'
              })}
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
              labels={labels || {}}
              btnText={intl.formatMessage({ id: 'common.button.addLabel' })}
            ></LabelSelector>
          </Form.Item>
          <VolumesConfig></VolumesConfig>
        </Container>
      </Form>
    </CollapsibleContainer>
  );
});

export default PoolForm;
