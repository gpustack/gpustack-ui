import ListMap from '@/components/dynamic-form/components/list-map';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React, { forwardRef } from 'react';
import { fieldConfig } from '../config/cloud-options-config';

const volumeOptions = fieldConfig.volumes;

const CloudOptions: React.FC<{
  ref?: any;
  disabled?: boolean;
}> = forwardRef((props, ref) => {
  const { disabled } = props;
  const intl = useIntl();
  const form = Form.useFormInstance();
  const volumes = Form.useWatch(['cloud_options', volumeOptions.name], form);

  const handleOnChange = (name: string, value: any) => {
    console.log('handleOnChange========', name, value);
    form.setFieldValue(['cloud_options', name], value);
  };

  return (
    <Form.Item name={['cloud_options', volumeOptions.name as string]}>
      <ListMap
        btnText={intl.formatMessage({ id: 'clusters.workerpool.volumes.add' })}
        label={intl.formatMessage({ id: 'clusters.workerpool.volumes' })}
        dataList={volumes || []}
        properties={volumeOptions.properties || {}}
        disabled={disabled}
        onChange={(value) => handleOnChange(volumeOptions.name, value)}
      />
    </Form.Item>
  );
});

export default CloudOptions;
