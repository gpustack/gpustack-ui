import AutoTooltip from '@/components/auto-tooltip';
import SealSelect from '@/components/seal-form/seal-select';
import { useIntl } from '@umijs/max';
import { Form, Select } from 'antd';
import React from 'react';
import { DeployFormKeyMap } from '../config';
import { useCatalogFormContext, useFormContext } from '../config/form-context';

const Performance: React.FC = () => {
  const intl = useIntl();
  const { formKey } = useFormContext();
  const { modeList = [], onModeChange } = useCatalogFormContext();

  if (formKey !== DeployFormKeyMap.CATALOG) return null;

  return (
    <>
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
    </>
  );
};

export default Performance;
