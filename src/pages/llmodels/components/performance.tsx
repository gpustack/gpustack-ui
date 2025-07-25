import SealSelect from '@/components/seal-form/seal-select';
import TooltipList from '@/components/tooltip-list';
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

const Performance: React.FC = () => {
  const intl = useIntl();
  const { onValuesChange, onQuantizationChange, source, quantizationOptions } =
    useFormContext();
  const { getRuleMessage } = useAppUtils();
  const form = Form.useFormInstance();

  const handleScheduleTypeChange = (value: string) => {
    if (value === 'auto') {
      onValuesChange?.({}, form.getFieldsValue());
    }
  };

  const handleOnQuantizationChange = (val: any) => {
    onQuantizationChange?.(val);
  };

  return (
    <>
      <Form.Item name="scheduleType">
        <SealSelect
          onChange={handleScheduleTypeChange}
          label={intl.formatMessage({ id: 'models.form.scheduletype' })}
          description={<TooltipList list={scheduleTypeTips}></TooltipList>}
          options={[
            {
              label: intl.formatMessage({
                id: 'models.form.scheduletype.auto'
              }),
              value: 'auto'
            },
            {
              label: intl.formatMessage({
                id: 'models.form.scheduletype.manual'
              }),
              value: 'manual'
            }
          ]}
        ></SealSelect>
      </Form.Item>
      <Form.Item<FormData>
        name="quantization"
        key="quantization"
        rules={[
          {
            required: true,
            message: getRuleMessage('select', 'quantization', false)
          }
        ]}
      >
        <SealSelect
          filterOption
          defaultActiveFirstOption
          disabled={false}
          options={quantizationOptions}
          onChange={handleOnQuantizationChange}
          label="Quantization"
          required
        ></SealSelect>
      </Form.Item>
      <div style={{ paddingBottom: 22, paddingLeft: 10 }}>
        <Form.Item<FormData>
          name="optimize_long_prompt"
          valuePropName="checked"
          style={{ padding: '0 10px', marginBottom: 0 }}
          noStyle
        >
          <CheckboxField
            title="Optimize long prompt tips"
            label="Optimize Long Prompt"
          ></CheckboxField>
        </Form.Item>
      </div>
      <div style={{ paddingBottom: 22, paddingLeft: 10 }}>
        <Form.Item<FormData>
          name="enable_speculative_decoding"
          valuePropName="checked"
          style={{ padding: '0 10px', marginBottom: 0 }}
          noStyle
        >
          <CheckboxField
            title="Enable speculative decoding tips"
            label="Enable Speculative Decoding"
          ></CheckboxField>
        </Form.Item>
      </div>
    </>
  );
};

export default Performance;
