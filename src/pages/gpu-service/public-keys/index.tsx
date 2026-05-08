import { INPUT_WIDTH } from '@/constants';
import { Textarea } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Form, message } from 'antd';
import React from 'react';
import PageBox from '../../_components/page-box';

interface PublicKeyFormData {
  public_key?: string;
}

const PLACEHOLDER = `以 ssh-rsa 或 ssh-ed25519 开头，每个 Public Key 单独一行

查看 Public Key：
- RSA
cat ~/.ssh/id_rsa.pub
- Ed25519
cat ~/.ssh/id_ed25519.pub`;

const GPUServicePublicKeys: React.FC = () => {
  const intl = useIntl();
  const [form] = Form.useForm<PublicKeyFormData>();

  const handleSave = async () => {
    try {
      await form.validateFields();
      message.success('操作成功');
    } catch {
      // ignore
    }
  };

  return (
    <PageBox>
      <Form
        style={{ width: INPUT_WIDTH.large }}
        name="gpuServicePublicKeyForm"
        form={form}
      >
        <Form.Item<PublicKeyFormData> name="public_key">
          <Textarea
            required
            label="SSH Public Key"
            placeholder={PLACEHOLDER}
            trim={false}
            alwaysFocus
            autoSize={{ minRows: 8, maxRows: 16 }}
            style={{ width: INPUT_WIDTH.large }}
          />
        </Form.Item>
        <Button
          type="primary"
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
