import SealCascader from '@/components/seal-form/seal-cascader';
import SealSelect from '@/components/seal-form/seal-select';
import TooltipList from '@/components/tooltip-list';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import { scheduleList, ScheduleValueMap } from '../config';
import { backendOptionsMap } from '../config/backend-parameters';
import { useCatalogFormContext, useFormContext } from '../config/form-context';
import GPUCard from './gpu-card';

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

const Performance: React.FC = () => {
  const intl = useIntl();
  const { onValuesChange, gpuOptions } = useFormContext();
  const { onQuantizationChange } = useCatalogFormContext();
  const { getRuleMessage } = useAppUtils();
  const form = Form.useFormInstance();

  const handleScheduleTypeChange = (value: string) => {
    if (value === ScheduleValueMap.Auto) {
      onValuesChange?.({}, form.getFieldsValue());
    }
  };

  const handleOnQuantizationChange = (val: any) => {
    onQuantizationChange?.(val);
  };

  const handleGpuSelectorChange = (value: any) => {};

  return (
    <>
      <Form.Item name="scheduleType">
        <SealSelect
          onChange={handleScheduleTypeChange}
          label={intl.formatMessage({ id: 'models.form.scheduletype' })}
          description={<TooltipList list={scheduleTypeTips}></TooltipList>}
          options={scheduleList}
        ></SealSelect>
      </Form.Item>
      {form.getFieldValue('scheduleType') ===
        ScheduleValueMap.SpecificGPUType && (
        <>
          <Form.Item name={['gpu_selector', 'gpu_type']}>
            <SealSelect
              label={intl.formatMessage({ id: 'models.form.gpuType' })}
              options={[]}
            ></SealSelect>
          </Form.Item>
          <Form.Item name={['gpu_selector', 'gpu_count']}>
            <SealSelect
              label={intl.formatMessage({ id: 'models.form.gpuCount' })}
              options={[
                {
                  label: 'Auto',
                  value: 'auto'
                },
                {
                  label: '1',
                  value: 1
                },
                {
                  label: '2',
                  value: 2
                },
                {
                  label: '4',
                  value: 4
                }
              ]}
            ></SealSelect>
          </Form.Item>
        </>
      )}
      {form.getFieldValue('scheduleType') === ScheduleValueMap.Manual &&
        !form.getFieldValue('fix_gpu_type') && (
          <>
            <Form.Item
              name={['gpu_selector', 'gpu_ids']}
              rules={[
                {
                  required: true,
                  message: getRuleMessage('select', 'models.form.gpuselector')
                }
              ]}
            >
              <SealCascader
                required
                showSearch
                expandTrigger="hover"
                multiple={
                  form.getFieldValue('backend') !== backendOptionsMap.voxBox
                }
                classNames={{
                  popup: {
                    root: 'cascader-popup-wrapper gpu-selector'
                  }
                }}
                maxTagCount={1}
                label={intl.formatMessage({ id: 'models.form.gpuselector' })}
                options={gpuOptions}
                showCheckedStrategy="SHOW_CHILD"
                value={form.getFieldValue(['gpu_selector', 'gpu_ids'])}
                optionNode={GPUCard}
                getPopupContainer={(triggerNode) => triggerNode.parentNode}
                onChange={handleGpuSelectorChange}
              ></SealCascader>
            </Form.Item>
          </>
        )}
      {/* <div style={{ paddingBottom: 22, paddingLeft: 10 }}>
        <Form.Item<FormData>
          name="optimize_long_prompt"
          valuePropName="checked"
          style={{ padding: '0 10px', marginBottom: 0 }}
          noStyle
        >
          <CheckboxField
            label={intl.formatMessage({ id: 'models.form.optimizeLongPrompt' })}
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
            label={intl.formatMessage({
              id: 'models.form.enableSpeculativeDecoding'
            })}
          ></CheckboxField>
        </Form.Item>
      </div> */}
    </>
  );
};

export default Performance;
