import SealSelect from '@/components/seal-form/seal-select';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import { ClusterFormData as FormData } from '../config/types';

interface CloudProviderProps {
  provider: string; // 'kubernetes' | 'digitalocean';
}

const CloudProvider: React.FC<CloudProviderProps> = () => {
  const intl = useIntl();
  return (
    <>
      <Form.Item<FormData>
        name="credential_id"
        rules={[
          {
            required: true,
            message: intl.formatMessage(
              { id: 'common.form.rule.input' },
              {
                name: 'credential'
              }
            )
          }
        ]}
      >
        <SealSelect
          label="Kubeconfig"
          required
          options={['credential1', 'credential2', 'credential3'].map(
            (item) => ({
              label: item,
              value: item
            })
          )}
        ></SealSelect>
      </Form.Item>
    </>
  );
};

export default CloudProvider;
