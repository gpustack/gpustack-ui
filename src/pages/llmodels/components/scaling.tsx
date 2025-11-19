import SealInputNumber from '@/components/seal-form/input-number';
import useAppUtils from '@/hooks/use-app-utils';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Checkbox, Form, Tooltip } from 'antd';
import { CheckboxChangeEvent } from 'antd/es/checkbox';
import React from 'react';
import { useFormContext } from '../config/form-context';

const scheduleTypeTips = [
  {
    title: {
      text: 'models.form.scheduletype.auto',
      locale: true
    },
    tips: 'models.form.scheduletype.auto.tips'
  },
  {
    title: {
      text: 'models.form.scheduletype.manual',
      locale: true
    },
    tips: 'models.form.scheduletype.manual.tips'
  }
];

const CheckboxField: React.FC<{
  title: string;
  label: string;
  checked?: boolean;
  onChange?: (e: CheckboxChangeEvent) => void;
}> = ({ title, label, checked, onChange }) => {
  return (
    <Checkbox className="p-l-6" checked={checked} onChange={onChange}>
      <Tooltip title={title}>
        <span style={{ color: 'var(--ant-color-text-tertiary)' }}>{label}</span>
        <QuestionCircleOutlined
          className="m-l-4"
          style={{ color: 'var(--ant-color-text-tertiary)' }}
        />
      </Tooltip>
    </Checkbox>
  );
};

const Scaling: React.FC = () => {
  const intl = useIntl();
  const { onValuesChange } = useFormContext();
  const { getRuleMessage } = useAppUtils();
  const form = Form.useFormInstance();

  return (
    <>
      <div style={{ paddingBottom: 22, paddingLeft: 10 }}>
        <Form.Item<FormData>
          name="enable_auto_scaling"
          valuePropName="checked"
          style={{ padding: '0 10px', marginBottom: 0 }}
          noStyle
        >
          <CheckboxField
            title="Enable auto scaling tips"
            label="Enable Auto Scaling"
          ></CheckboxField>
        </Form.Item>
      </div>
      <Form.Item<FormData>
        name="min_replicas"
        rules={[
          {
            required: true
          }
        ]}
      >
        <SealInputNumber
          min={0}
          style={{ width: '100%' }}
          label="Min Replicas"
          required
        ></SealInputNumber>
      </Form.Item>
      <Form.Item<FormData>
        name="max_replicas"
        rules={[
          {
            required: true
          }
        ]}
      >
        <SealInputNumber
          min={0}
          style={{ width: '100%' }}
          label="Max Replicas"
          required
        ></SealInputNumber>
      </Form.Item>
      <Form.Item<FormData>
        name="scale_to_zero_window"
        rules={[
          {
            required: true
          }
        ]}
      >
        <SealInputNumber
          min={0}
          style={{ width: '100%' }}
          label="Scale to Zero Window"
          required
        ></SealInputNumber>
      </Form.Item>
      <Form.Item<FormData>
        name="scale_down_window"
        rules={[
          {
            required: true
          }
        ]}
      >
        <SealInputNumber
          min={0}
          style={{ width: '100%' }}
          label="Scale Down Window"
          required
        ></SealInputNumber>
      </Form.Item>
      <Form.Item<FormData>
        name="scale_up_window"
        rules={[
          {
            required: true
          }
        ]}
      >
        <SealInputNumber
          min={0}
          style={{ width: '100%' }}
          label="Scale Up Window"
          required
        ></SealInputNumber>
      </Form.Item>
    </>
  );
};

export default Scaling;
