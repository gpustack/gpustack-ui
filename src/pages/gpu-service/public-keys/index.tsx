import { Input as CInput, Textarea, useAppUtils } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Form, message } from 'antd';
import React, { useEffect } from 'react';
import PageBox from '../../_components/page-box';
import useGetSshkey from './services/use-get-sshkey';
import useUpdateSshkey from './services/use-update-sshkey';
import { FormData } from './types';

const GPUServicePublicKeys: React.FC = () => {
  const intl = useIntl();
  const [form] = Form.useForm<FormData>();
  const { getRuleMessage } = useAppUtils();
  const { fetchData: fetchSshkey } = useGetSshkey();
  const { fetchData: updateSshkey, loading: updating } = useUpdateSshkey();

  useEffect(() => {
    fetchSshkey({}).then((res) => {
      const data = res?.spec?.data || '';
      form.setFieldsValue({
        name: res?.name,
        spec: {
          data
        }
      });
    });
  }, []);

  const handleSave = async () => {
    form.submit();
  };

  const onFinish = async (values: FormData) => {
    try {
      await updateSshkey({
        data: values
      });
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {
      // ignore
    }
  };

  return (
    <PageBox>
      <Form
        style={{ width: 700 }}
        name="gpuServicePublicKeyForm"
        form={form}
        onFinish={onFinish}
        initialValues={{
          name: 'SSHPublicKey',
          spec: {
            data: ''
          }
        }}
      >
        <Form.Item<FormData> name="name" hidden>
          <CInput.Input />
        </Form.Item>
        <Form.Item<FormData>
          name={['spec', 'data']}
          rules={[
            {
              required: true,
              message: getRuleMessage('input', 'gpuservice.publicKey.label')
            }
          ]}
        >
          <Textarea
            required
            label={intl.formatMessage({ id: 'gpuservice.publicKey.label' })}
            placeholder={intl.formatMessage({
              id: 'gpuservice.publicKey.placeholder'
            })}
            trim={false}
            alwaysFocus
            autoSize={{ minRows: 8, maxRows: 16 }}
            style={{ width: 700, minHeight: 186 }}
          />
        </Form.Item>
        <Button
          type="primary"
          loading={updating}
          style={{ width: 120, marginTop: 24 }}
          onClick={handleSave}
        >
          {intl.formatMessage({ id: 'common.button.save' })}
        </Button>
      </Form>
    </PageBox>
  );
};

export default GPUServicePublicKeys;
