import AutoTooltip from '@/components/auto-tooltip';
import SealSelect from '@/components/seal-form/seal-select';
import { useIntl } from '@umijs/max';
import { Form, Select } from 'antd';
import React from 'react';
import { DeployFormKeyMap } from '../config';
import { useCatalogFormContext, useFormContext } from '../config/form-context';
import KVCacheForm from './kv-cache';
import SpeculativeDecode from './speculative-decode';

const modeTipsList = [
  {
    title: {
      text: 'models.form.mode.throughput',
      locale: true
    },
    tips: 'models.form.mode.throughput.tips'
  },
  {
    title: {
      text: 'models.form.mode.latency',
      locale: true
    },
    tips: 'models.form.mode.latency.tips'
  },
  {
    title: {
      text: 'models.form.mode.baseline',
      locale: true
    },
    tips: 'models.form.mode.baseline.tips'
  }
];

const Performance: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const { formKey } = useFormContext();
  const { modeList = [], onModeChange } = useCatalogFormContext();

  return (
    <>
      <div data-field="extended_kv_cache.enabled"></div>
      {formKey === DeployFormKeyMap.CATALOG && (
        <Form.Item name="mode">
          <SealSelect
            onChange={onModeChange}
            label={intl.formatMessage({ id: 'models.form.mode' })}
          >
            {modeList?.map((item: any) => (
              <Select.Option key={item.value} value={item.value}>
                <AutoTooltip
                  showTitle={item.isBuiltIn}
                  ghost
                  title={
                    item?.tips
                      ? intl.formatMessage({ id: item?.tips || '' })
                      : false
                  }
                >
                  {item.isBuiltIn
                    ? intl.formatMessage({ id: item?.label || '' })
                    : item.label}
                </AutoTooltip>
              </Select.Option>
            ))}
          </SealSelect>
        </Form.Item>
      )}
      <KVCacheForm></KVCacheForm>
      <SpeculativeDecode></SpeculativeDecode>
    </>
  );
};

export default Performance;
