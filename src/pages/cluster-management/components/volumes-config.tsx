import ListMap from '@/components/dynamic-form/components/list-map';
import { statusType } from '@/components/dynamic-form/config/types';
import useValidateFields from '@/components/dynamic-form/hooks/use-validate-fields';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React, { forwardRef, useState } from 'react';
import { fieldConfig } from '../config/cloud-options-config';

const volumeOptions = fieldConfig.volumes;

const CloudOptions: React.FC<{
  ref?: any;
  disabled?: boolean;
}> = forwardRef((props, ref) => {
  const { disabled } = props;
  const intl = useIntl();
  const form = Form.useFormInstance();
  const volumes =
    Form.useWatch(['cloud_options', volumeOptions.name], form) || [];
  const [validateStatusList, setValidateStatusList] = useState<
    { [key: string]: statusType }[]
  >([]);

  const updateValidateStatusList = (list: { [key: string]: statusType }[]) => {
    setValidateStatusList(list);
  };

  const { listMapValidator, toggleValidation } = useValidateFields({
    requiredFields: volumeOptions.required,
    setValidateStatusList: updateValidateStatusList
  });

  const handleOnChange = (value: any) => {
    toggleValidation(true);
    form.setFieldValue(['cloud_options', volumeOptions.name], value);
  };

  const handleOnAdd = (data: any[]) => {
    toggleValidation(false);
    form.setFieldValue(['cloud_options', volumeOptions.name], data);
    toggleValidation(true);
  };

  const handleOnDelete = (deletedItem: any, data: any[]) => {
    toggleValidation(false);
    form.setFieldValue(['cloud_options', volumeOptions.name], data);
    toggleValidation(true);
  };
  return (
    <Form.Item
      name={['cloud_options', volumeOptions.name as string]}
      style={{
        backgroundColor:
          disabled && volumes?.length === 0
            ? 'var(--ant-color-bg-container-disabled)'
            : ''
      }}
      rules={[
        {
          validator: listMapValidator
        }
      ]}
    >
      <ListMap
        validateStatusList={validateStatusList}
        btnText={intl.formatMessage({ id: 'clusters.workerpool.volumes.add' })}
        label={intl.formatMessage({ id: 'clusters.workerpool.volumes' })}
        dataList={volumes || []}
        properties={volumeOptions.properties || {}}
        requiredFields={volumeOptions.required || []}
        disabled={disabled}
        onAdd={handleOnAdd}
        onDelete={handleOnDelete}
        onChange={handleOnChange}
      />
    </Form.Item>
  );
});

export default CloudOptions;
